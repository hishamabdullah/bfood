import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";
import { withTimeout } from "@/lib/withTimeout";
import { dynamicQueryOptions } from "@/lib/queryConfig";

export type OrderItem = Tables<"order_items"> & {
  product?: Tables<"products"> | null;
  supplier_profile?: Pick<Tables<"profiles">, "business_name" | "user_id" | "bank_name" | "bank_account_name" | "bank_iban"> | null;
};

export type Order = Tables<"orders"> & {
  order_items?: OrderItem[];
  branch?: Tables<"branches"> | null;
};

// Hook للمستخدم الفرعي لعرض طلباته فقط
export const useSubUserOrders = () => {
  const { user, isSubUser, subUserInfo } = useAuth();
  const queryClient = useQueryClient();

  const restaurantId = isSubUser && subUserInfo ? subUserInfo.restaurant_id : null;

  // Realtime subscription
  useEffect(() => {
    if (!user || !isSubUser) return;

    const orderItemsChannel = supabase
      .channel('sub-user-order-items-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["sub-user-orders"] });
        }
      )
      .subscribe();

    const ordersChannel = supabase
      .channel('sub-user-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["sub-user-orders"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(orderItemsChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, [user, isSubUser, queryClient]);

  return useQuery({
    queryKey: ["sub-user-orders", user?.id],
    queryFn: async () => {
      if (!user || !isSubUser || !restaurantId) return [];

      // أولاً نجلب طلبات الموافقة التي طلبها هذا المستخدم
      const { data: approvalRequests, error: approvalError } = await withTimeout(
        supabase
          .from("order_approval_requests")
          .select("order_id")
          .eq("requested_by", user.id),
        8000,
        "approval-requests timeout"
      );

      if (approvalError) throw approvalError;

      if (!approvalRequests || approvalRequests.length === 0) {
        return [];
      }

      const orderIds = approvalRequests.map((r) => r.order_id);

      // ثم نجلب تفاصيل هذه الطلبات
      const { data, error } = await withTimeout(
        supabase
          .from("orders")
          .select(`
            *,
            branch:branches(id, name, address),
            order_items (
              id,
              product_id,
              supplier_id,
              quantity,
              unit_price,
              status,
              delivery_fee,
              invoice_url,
              product:products (
                id,
                name,
                image_url,
                unit,
                delivery_fee
              )
            )
          `)
          .in("id", orderIds)
          .order("created_at", { ascending: false }),
        8000,
        "sub-user-orders timeout"
      );

      if (error) throw error;

      // Get unique supplier IDs
      const supplierIds = new Set<string>();
      data?.forEach((order) => {
        order.order_items?.forEach((item: any) => {
          if (item.supplier_id) {
            supplierIds.add(item.supplier_id);
          }
        });
      });

      // Fetch supplier profiles
      let supplierProfiles: Pick<Tables<"profiles">, "user_id" | "business_name" | "bank_name" | "bank_account_name" | "bank_iban">[] = [];
      if (supplierIds.size > 0) {
        const { data: profiles, error: profilesError } = await withTimeout(
          supabase
            .from("profiles")
            .select("user_id, business_name, bank_name, bank_account_name, bank_iban")
            .in("user_id", Array.from(supplierIds)),
          8000,
          "supplier-profiles timeout"
        );
        if (profilesError) throw profilesError;
        supplierProfiles = profiles || [];
      }

      const profileMap = new Map(supplierProfiles.map(p => [p.user_id, p]));

      const ordersWithSuppliers = data?.map((order) => ({
        ...order,
        order_items: order.order_items?.map((item: any) => ({
          ...item,
          supplier_profile: profileMap.get(item.supplier_id) || null,
        })),
      }));

      return ordersWithSuppliers as Order[];
    },
    enabled: !!user && isSubUser && !!restaurantId,
    retry: 1,
    ...dynamicQueryOptions,
  });
};

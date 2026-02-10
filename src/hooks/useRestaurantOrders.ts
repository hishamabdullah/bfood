import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";
import { withTimeout } from "@/lib/withTimeout";
import { dynamicQueryOptions } from "@/lib/queryConfig";
import { useSubUserContext, useEffectiveRestaurantId } from "@/hooks/useSubUserContext";

export type OrderItem = Tables<"order_items"> & {
  product?: Tables<"products"> | null;
  supplier_profile?: Pick<Tables<"profiles">, "business_name" | "user_id" | "bank_name" | "bank_account_name" | "bank_iban"> | null;
  delivery_agent?: {
    id: string;
    name: string;
    phone: string | null;
    bank_name: string | null;
    bank_account_name: string | null;
    bank_iban: string | null;
  } | null;
};

export type Order = Tables<"orders"> & {
  order_items?: OrderItem[];
  branch?: Tables<"branches"> | null;
};

export const useRestaurantOrders = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: subUserContext, isLoading: subUserLoading } = useSubUserContext();
  const { restaurantId: effectiveRestaurantId, isLoading: restaurantIdLoading } = useEffectiveRestaurantId();

  // Realtime subscription لتحديث البيانات فوراً بعد التعديل
  useEffect(() => {
    if (!user) return;

    // الاستماع لتغييرات عناصر الطلبات
    const orderItemsChannel = supabase
      .channel('restaurant-order-items-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
        },
        (payload) => {
          console.log('Restaurant order items changed:', payload);
          queryClient.invalidateQueries({ queryKey: ["restaurant-orders"] });
        }
      )
      .subscribe();

    // الاستماع لتغييرات الطلبات الرئيسية
    const ordersChannel = supabase
      .channel('restaurant-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('Restaurant orders changed:', payload);
          queryClient.invalidateQueries({ queryKey: ["restaurant-orders"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(orderItemsChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, [user, queryClient]);

  return useQuery({
    queryKey: ["restaurant-orders", effectiveRestaurantId, !!subUserContext?.isSubUser, user?.id],
    queryFn: async () => {
      if (!user || !effectiveRestaurantId) return [];
      
      const restaurantId = effectiveRestaurantId;

      // بناء الاستعلام الأساسي
      let query = supabase
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
            delivery_type,
            delivery_agent_id,
            delivery_agent:delivery_agents(id, name, phone, bank_name, bank_account_name, bank_iban),
            product:products (
              id,
              name,
              image_url,
              unit,
              delivery_fee
            )
          )
        `)
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

      // إذا كان مستخدم فرعي، فلتر الطلبات التي أنشأها هو فقط
      if (subUserContext?.isSubUser) {
        query = query.eq("created_by_user_id", user.id);
      }

      const { data, error } = await withTimeout(
        query,
        8000,
        "restaurant-orders timeout"
      );

      if (error) throw error;

      // Get unique supplier IDs from all order items
      const supplierIds = new Set<string>();
      data?.forEach((order) => {
        order.order_items?.forEach((item: any) => {
          if (item.supplier_id) {
            supplierIds.add(item.supplier_id);
          }
        });
      });

      // Fetch supplier profiles with bank details if there are suppliers
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

      // Create a map for faster lookups
      const profileMap = new Map(supplierProfiles.map(p => [p.user_id, p]));

      // Map supplier profiles to order items
      const ordersWithSuppliers = data?.map((order) => ({
        ...order,
        order_items: order.order_items?.map((item: any) => ({
          ...item,
          supplier_profile: profileMap.get(item.supplier_id) || null,
        })),
      }));

      return ordersWithSuppliers as Order[];
    },
    enabled: !!user && !!effectiveRestaurantId && !subUserLoading && !restaurantIdLoading,
    retry: 1,
    ...dynamicQueryOptions,
  });
};
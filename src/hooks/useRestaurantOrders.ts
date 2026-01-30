import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";
import { withTimeout } from "@/lib/withTimeout";

export type OrderItem = Tables<"order_items"> & {
  product?: Tables<"products"> | null;
  supplier_profile?: Pick<Tables<"profiles">, "business_name" | "user_id" | "bank_name" | "bank_account_name" | "bank_iban"> | null;
};

export type Order = Tables<"orders"> & {
  order_items?: OrderItem[];
  branch?: Tables<"branches"> | null;
};

export const useRestaurantOrders = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["restaurant-orders", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await withTimeout(
        supabase
          .from("orders")
          .select(`
            *,
            branch:branches(*),
            order_items (
              *,
              product:products (
                id,
                name,
                image_url,
                unit,
                delivery_fee
              )
            )
          `)
          .eq("restaurant_id", user.id)
          .order("created_at", { ascending: false }),
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

      // Fetch supplier profiles with bank details
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

      // Map supplier profiles to order items
      const ordersWithSuppliers = data?.map((order) => ({
        ...order,
        order_items: order.order_items?.map((item: any) => ({
          ...item,
          supplier_profile: supplierProfiles.find((p) => p.user_id === item.supplier_id) || null,
        })),
      }));

      return ordersWithSuppliers as Order[];
    },
    enabled: !!user,
    retry: 1,
  });
};
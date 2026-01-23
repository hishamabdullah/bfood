import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

export type OrderItem = Tables<"order_items"> & {
  product?: Tables<"products"> | null;
  supplier_profile?: Tables<"profiles"> | null;
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

      const { data, error } = await supabase
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
        .order("created_at", { ascending: false });

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

      // Fetch supplier profiles
      let supplierProfiles: Tables<"profiles">[] = [];
      if (supplierIds.size > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .in("user_id", Array.from(supplierIds));
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
  });
};
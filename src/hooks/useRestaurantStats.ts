import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { realtimeQueryOptions } from "@/lib/queryConfig";

export interface RestaurantStats {
  totalOrders: number;
  pendingOrders: number;
  totalPurchases: number;
}

export const useRestaurantStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["restaurant-stats", user?.id],
    queryFn: async (): Promise<RestaurantStats> => {
      if (!user) {
        return { totalOrders: 0, pendingOrders: 0, totalPurchases: 0 };
      }

      // Run all queries in parallel for better performance
      const [totalResult, pendingResult, purchasesResult] = await Promise.all([
        // إجمالي الطلبات
        supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("restaurant_id", user.id),
        // الطلبات قيد التنفيذ
        supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("restaurant_id", user.id)
          .not("status", "in", '("delivered","cancelled")'),
        // إجمالي المشتريات
        supabase
          .from("orders")
          .select("total_amount")
          .eq("restaurant_id", user.id)
          .eq("status", "delivered"),
      ]);

      const totalPurchases = purchasesResult.data?.reduce(
        (sum, order) => sum + (order.total_amount || 0),
        0
      ) || 0;

      return {
        totalOrders: totalResult.count || 0,
        pendingOrders: pendingResult.count || 0,
        totalPurchases,
      };
    },
    enabled: !!user,
    ...realtimeQueryOptions,
  });
};

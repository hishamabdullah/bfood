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

  const restaurantId = user?.id;

  return useQuery({
    queryKey: ["restaurant-stats", restaurantId],
    queryFn: async (): Promise<RestaurantStats> => {
      if (!restaurantId) {
        return { totalOrders: 0, pendingOrders: 0, totalPurchases: 0 };
      }

      // Run all queries in parallel for better performance
      const [totalResult, pendingResult, purchasesResult] = await Promise.all([
        // إجمالي الطلبات
        supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("restaurant_id", restaurantId),
        // الطلبات قيد التنفيذ
        supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("restaurant_id", restaurantId)
          .not("status", "in", '("delivered","cancelled")'),
        // إجمالي المشتريات
        supabase
          .from("orders")
          .select("total_amount")
          .eq("restaurant_id", restaurantId)
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
    enabled: !!restaurantId,
    ...realtimeQueryOptions,
  });
};

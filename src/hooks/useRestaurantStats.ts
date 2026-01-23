import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

      // إجمالي الطلبات
      const { count: totalOrders } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("restaurant_id", user.id);

      // الطلبات قيد التنفيذ (غير delivered وغير cancelled)
      const { count: pendingOrders } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("restaurant_id", user.id)
        .not("status", "in", '("delivered","cancelled")');

      // إجمالي المشتريات (الطلبات التي تم توصيلها فقط)
      const { data: deliveredOrders } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("restaurant_id", user.id)
        .eq("status", "delivered");

      const totalPurchases = deliveredOrders?.reduce(
        (sum, order) => sum + (order.total_amount || 0),
        0
      ) || 0;

      return {
        totalOrders: totalOrders || 0,
        pendingOrders: pendingOrders || 0,
        totalPurchases,
      };
    },
    enabled: !!user,
  });
};

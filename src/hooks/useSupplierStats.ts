import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { realtimeQueryOptions } from "@/lib/queryConfig";

export interface SupplierStats {
  totalOrders: number;
  pendingOrders: number;
  newOrders: number;
  totalProducts: number;
  totalSales: number;
}

export const useSupplierStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["supplier-stats", user?.id],
    queryFn: async (): Promise<SupplierStats> => {
      if (!user) {
        return { totalOrders: 0, pendingOrders: 0, newOrders: 0, totalProducts: 0, totalSales: 0 };
      }

      // Run all queries in parallel for better performance
      const [totalResult, pendingResult, newResult, productsResult, salesResult] = await Promise.all([
        // إجمالي الطلبات
        supabase
          .from("order_items")
          .select("*", { count: "exact", head: true })
          .eq("supplier_id", user.id),
        // الطلبات قيد التنفيذ
        supabase
          .from("order_items")
          .select("*", { count: "exact", head: true })
          .eq("supplier_id", user.id)
          .not("status", "in", '("delivered","cancelled")'),
        // الطلبات الجديدة
        supabase
          .from("order_items")
          .select("*", { count: "exact", head: true })
          .eq("supplier_id", user.id)
          .eq("status", "pending"),
        // عدد المنتجات
        supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("supplier_id", user.id),
        // إجمالي المبيعات
        supabase
          .from("order_items")
          .select("unit_price, quantity")
          .eq("supplier_id", user.id)
          .eq("status", "delivered"),
      ]);

      const totalSales = salesResult.data?.reduce(
        (sum, item) => sum + (item.unit_price * item.quantity),
        0
      ) || 0;

      return {
        totalOrders: totalResult.count || 0,
        pendingOrders: pendingResult.count || 0,
        newOrders: newResult.count || 0,
        totalProducts: productsResult.count || 0,
        totalSales,
      };
    },
    enabled: !!user,
    ...realtimeQueryOptions,
  });
};

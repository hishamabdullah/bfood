import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SupplierStats {
  totalOrders: number;
  pendingOrders: number;
  newOrders: number; // الطلبات الجديدة التي لم يراها المورد (pending)
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

      // إجمالي الطلبات
      const { count: totalOrders } = await supabase
        .from("order_items")
        .select("*", { count: "exact", head: true })
        .eq("supplier_id", user.id);

      // الطلبات قيد التنفيذ (غير delivered وغير cancelled)
      const { count: pendingOrders } = await supabase
        .from("order_items")
        .select("*", { count: "exact", head: true })
        .eq("supplier_id", user.id)
        .not("status", "in", '("delivered","cancelled")');

      // الطلبات الجديدة التي لم يراها المورد (pending فقط)
      const { count: newOrders } = await supabase
        .from("order_items")
        .select("*", { count: "exact", head: true })
        .eq("supplier_id", user.id)
        .eq("status", "pending");

      // عدد المنتجات
      const { count: totalProducts } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("supplier_id", user.id);

      // إجمالي المبيعات (الطلبات التي تم توصيلها فقط)
      const { data: deliveredItems } = await supabase
        .from("order_items")
        .select("unit_price, quantity")
        .eq("supplier_id", user.id)
        .eq("status", "delivered");

      const totalSales = deliveredItems?.reduce(
        (sum, item) => sum + (item.unit_price * item.quantity),
        0
      ) || 0;

      return {
        totalOrders: totalOrders || 0,
        pendingOrders: pendingOrders || 0,
        newOrders: newOrders || 0,
        totalProducts: totalProducts || 0,
        totalSales,
      };
    },
    enabled: !!user,
  });
};

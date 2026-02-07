import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export interface MonthlySpending {
  month: string;
  amount: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalSpent: number;
  imageUrl: string | null;
}

export interface SupplierSpending {
  supplierId: string;
  supplierName: string;
  totalSpent: number;
  ordersCount: number;
}

export interface RestaurantAnalytics {
  monthlySpending: MonthlySpending[];
  topProducts: TopProduct[];
  supplierBreakdown: SupplierSpending[];
  totalSpentThisMonth: number;
  totalSpentLastMonth: number;
  monthlyChange: number;
}

export const useRestaurantAnalytics = (monthsToFetch: number = 6) => {
  const { user } = useAuth();
  
  const restaurantId = user?.id;

  return useQuery({
    queryKey: ["restaurant-analytics", restaurantId, monthsToFetch],
    queryFn: async (): Promise<RestaurantAnalytics> => {
      if (!restaurantId) {
        return {
          monthlySpending: [],
          topProducts: [],
          supplierBreakdown: [],
          totalSpentThisMonth: 0,
          totalSpentLastMonth: 0,
          monthlyChange: 0,
        };
      }

      const now = new Date();
      const startDate = startOfMonth(subMonths(now, monthsToFetch - 1));

      // Fetch all delivered orders with items in the date range
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(`
          id,
          created_at,
          total_amount,
          order_items (
            id,
            product_id,
            supplier_id,
            quantity,
            unit_price,
            status,
            product:products (
              id,
              name,
              image_url
            )
          )
        `)
        .eq("restaurant_id", restaurantId)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      if (ordersError) throw ordersError;

      // Get supplier IDs for profile lookup
      const supplierIds = new Set<string>();
      orders?.forEach((order) => {
        order.order_items?.forEach((item: any) => {
          if (item.supplier_id) {
            supplierIds.add(item.supplier_id);
          }
        });
      });

      // Fetch supplier profiles
      let supplierProfiles: { user_id: string; business_name: string }[] = [];
      if (supplierIds.size > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, business_name")
          .in("user_id", Array.from(supplierIds));
        supplierProfiles = profiles || [];
      }
      const profileMap = new Map(supplierProfiles.map(p => [p.user_id, p.business_name]));

      // Calculate monthly spending
      const monthlyMap = new Map<string, number>();
      for (let i = 0; i < monthsToFetch; i++) {
        const monthDate = subMonths(now, monthsToFetch - 1 - i);
        const monthKey = format(monthDate, "yyyy-MM");
        monthlyMap.set(monthKey, 0);
      }

      orders?.forEach((order) => {
        const monthKey = format(new Date(order.created_at), "yyyy-MM");
        // Sum only delivered items
        const deliveredAmount = order.order_items
          ?.filter((item: any) => item.status === "delivered")
          .reduce((sum: number, item: any) => sum + (item.unit_price * item.quantity), 0) || 0;
        
        if (monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + deliveredAmount);
        }
      });

      const monthlySpending: MonthlySpending[] = Array.from(monthlyMap.entries()).map(
        ([month, amount]) => ({ month, amount })
      );

      // Calculate top products
      const productMap = new Map<string, { quantity: number; spent: number; name: string; imageUrl: string | null }>();
      orders?.forEach((order) => {
        order.order_items?.forEach((item: any) => {
          if (item.status === "delivered" && item.product) {
            const existing = productMap.get(item.product_id) || {
              quantity: 0,
              spent: 0,
              name: item.product.name,
              imageUrl: item.product.image_url,
            };
            existing.quantity += item.quantity;
            existing.spent += item.unit_price * item.quantity;
            productMap.set(item.product_id, existing);
          }
        });
      });

      const topProducts: TopProduct[] = Array.from(productMap.entries())
        .map(([productId, data]) => ({
          productId,
          productName: data.name,
          totalQuantity: data.quantity,
          totalSpent: data.spent,
          imageUrl: data.imageUrl,
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10);

      // Calculate supplier breakdown
      const supplierCalcMap = new Map<string, { spent: number; orders: Set<string> }>();
      orders?.forEach((order) => {
        order.order_items?.forEach((item: any) => {
          if (item.status === "delivered") {
            const existing = supplierCalcMap.get(item.supplier_id) || { spent: 0, orders: new Set() };
            existing.spent += item.unit_price * item.quantity;
            existing.orders.add(order.id);
            supplierCalcMap.set(item.supplier_id, existing);
          }
        });
      });

      const supplierBreakdown: SupplierSpending[] = Array.from(supplierCalcMap.entries())
        .map(([supplierId, data]) => ({
          supplierId,
          supplierName: profileMap.get(supplierId) || "مورد غير معروف",
          totalSpent: data.spent,
          ordersCount: data.orders.size,
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent);

      // Calculate this month vs last month
      const thisMonthKey = format(now, "yyyy-MM");
      const lastMonthKey = format(subMonths(now, 1), "yyyy-MM");
      const totalSpentThisMonth = monthlyMap.get(thisMonthKey) || 0;
      const totalSpentLastMonth = monthlyMap.get(lastMonthKey) || 0;
      const monthlyChange = totalSpentLastMonth > 0
        ? ((totalSpentThisMonth - totalSpentLastMonth) / totalSpentLastMonth) * 100
        : 0;

      return {
        monthlySpending,
        topProducts,
        supplierBreakdown,
        totalSpentThisMonth,
        totalSpentLastMonth,
        monthlyChange,
      };
    },
    enabled: !!restaurantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

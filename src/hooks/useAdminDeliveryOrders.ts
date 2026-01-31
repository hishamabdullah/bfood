import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type DeliveryOrderItem = {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  unit: string;
};

export type DeliveryOrderSupplier = {
  supplier_id: string;
  supplier_profile: Tables<"profiles"> | null;
  delivery_fee: number;
  items_total: number;
  items_count: number;
  is_paid: boolean;
  receipt_url: string | null;
  items: DeliveryOrderItem[];
};

export type DeliveryOrder = Tables<"orders"> & {
  restaurant_profile: Tables<"profiles"> | null;
  branch: Tables<"branches"> | null;
  suppliers: DeliveryOrderSupplier[];
};

// جلب طلبات التوصيل للمدير (فقط الطلبات التي فيها توصيل)
export const useAdminDeliveryOrders = () => {
  return useQuery({
    queryKey: ["admin-delivery-orders"],
    queryFn: async () => {
      // جلب الطلبات التي فيها توصيل (is_pickup = false or null)
      const { data: orders, error } = await supabase
        .from("orders")
        .select(`
          *,
          branch:branches(*)
        `)
        .or("is_pickup.eq.false,is_pickup.is.null")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!orders || orders.length === 0) return [];

      // جلب معلومات المطاعم
      const restaurantIds = [...new Set(orders.map(o => o.restaurant_id))];
      const { data: restaurantProfiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", restaurantIds);

      // جلب عناصر الطلبات مع بيانات المنتج
      const orderIds = orders.map(o => o.id);
      const { data: orderItems } = await supabase
        .from("order_items")
        .select(`
          *,
          product:products(id, name, unit)
        `)
        .in("order_id", orderIds);

      // جلب ملفات الموردين
      const supplierIds = [...new Set(orderItems?.map(i => i.supplier_id) || [])];
      const { data: supplierProfiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", supplierIds);

      // جلب حالات الدفع
      const { data: payments } = await supabase
        .from("order_payments")
        .select("*")
        .in("order_id", orderIds);

      // دمج البيانات
      const enrichedOrders = orders.map(order => {
        // تجميع عناصر الطلب حسب المورد
        const orderItemsForOrder = orderItems?.filter(i => i.order_id === order.id) || [];
        const supplierGroups = new Map<string, {
          items: typeof orderItemsForOrder;
          delivery_fee: number;
        }>();

        orderItemsForOrder.forEach(item => {
          const existing = supplierGroups.get(item.supplier_id);
          if (existing) {
            existing.items.push(item);
            // نأخذ أعلى رسوم توصيل لكل مورد
            existing.delivery_fee = Math.max(existing.delivery_fee, Number(item.delivery_fee || 0));
          } else {
            supplierGroups.set(item.supplier_id, {
              items: [item],
              delivery_fee: Number(item.delivery_fee || 0),
            });
          }
        });

        const suppliers: DeliveryOrderSupplier[] = Array.from(supplierGroups.entries()).map(([supplierId, group]) => {
          const payment = payments?.find(p => p.order_id === order.id && p.supplier_id === supplierId);
          const itemsTotal = group.items.reduce((sum, item) => sum + (item.quantity * Number(item.unit_price)), 0);
          
          // تحويل العناصر لصيغة مختصرة
          const formattedItems: DeliveryOrderItem[] = group.items.map(item => ({
            product_id: item.product_id,
            product_name: (item as any).product?.name || "منتج غير معروف",
            quantity: item.quantity,
            unit_price: Number(item.unit_price),
            unit: (item as any).product?.unit || "وحدة",
          }));
          
          return {
            supplier_id: supplierId,
            supplier_profile: supplierProfiles?.find(p => p.user_id === supplierId) || null,
            delivery_fee: group.delivery_fee,
            items_total: itemsTotal,
            items_count: group.items.length,
            is_paid: payment?.is_paid || false,
            receipt_url: payment?.receipt_url || null,
            items: formattedItems,
          };
        });

        return {
          ...order,
          restaurant_profile: restaurantProfiles?.find(p => p.user_id === order.restaurant_id) || null,
          suppliers,
        } as DeliveryOrder;
      });

      // فقط إرجاع الطلبات التي فيها موردين (للتوصيل)
      return enrichedOrders.filter(o => o.suppliers.length > 0);
    },
  });
};

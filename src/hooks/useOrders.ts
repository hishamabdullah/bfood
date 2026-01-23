import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { CartItem } from "@/contexts/CartContext";

interface CreateOrderParams {
  items: CartItem[];
  deliveryAddress?: string;
  notes?: string;
  branchId?: string;
  supplierDeliveryFees?: Record<string, { fee: number; reason: string }>;
}

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async ({ items, deliveryAddress, notes, branchId, supplierDeliveryFees = {} }: CreateOrderParams) => {
      if (!user) throw new Error("يجب تسجيل الدخول أولاً");

      // Calculate total
      const subtotal = items.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0
      );
      
      // حساب رسوم التوصيل من الحد الأدنى للموردين
      const totalDeliveryFee = Object.values(supplierDeliveryFees).reduce(
        (total, { fee }) => total + fee,
        0
      );
      const totalAmount = subtotal + totalDeliveryFee;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          restaurant_id: user.id,
          total_amount: totalAmount,
          delivery_fee: totalDeliveryFee,
          delivery_address: deliveryAddress,
          notes,
          status: "pending",
          branch_id: branchId || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Group items by supplier
      const itemsBySupplier: Record<string, CartItem[]> = {};
      items.forEach((item) => {
        const supplierId = item.product.supplier_id;
        if (!itemsBySupplier[supplierId]) {
          itemsBySupplier[supplierId] = [];
        }
        itemsBySupplier[supplierId].push(item);
      });

      // Create order items with supplier-specific delivery fee
      const orderItems = items.map((item) => {
        const supplierId = item.product.supplier_id;
        // Calculate per-item delivery fee proportionally
        const supplierItems = itemsBySupplier[supplierId];
        const supplierTotalFee = supplierDeliveryFees[supplierId]?.fee || 0;
        // Distribute delivery fee across first item of each supplier for simplicity
        const isFirstItem = supplierItems[0].product.id === item.product.id;
        
        return {
          order_id: order.id,
          product_id: item.product.id,
          supplier_id: supplierId,
          quantity: item.quantity,
          unit_price: item.product.price,
          status: "pending",
          delivery_fee: isFirstItem ? supplierTotalFee : 0,
        };
      });

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // إرسال إشعارات للموردين
      const supplierIds = [...new Set(items.map((item) => item.product.supplier_id))];
      const restaurantName = profile?.business_name || "مطعم";

      const notifications = supplierIds.map((supplierId) => ({
        user_id: supplierId,
        title: "طلب جديد",
        message: `لديك طلب جديد من ${restaurantName}`,
        type: "order",
        order_id: order.id,
      }));

      // إنشاء الإشعارات (لا نوقف العملية إذا فشل)
      await supabase.from("notifications").insert(notifications).throwOnError();

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

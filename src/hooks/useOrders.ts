import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { CartItem } from "@/contexts/CartContext";

interface CreateOrderParams {
  items: CartItem[];
  deliveryAddress?: string;
  notes?: string;
  branchId?: string;
}

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async ({ items, deliveryAddress, notes, branchId }: CreateOrderParams) => {
      if (!user) throw new Error("يجب تسجيل الدخول أولاً");

      // Calculate total
      const subtotal = items.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0
      );
      // حساب رسوم التوصيل من المنتجات
      const deliveryFee = items.reduce(
        (total, item) => total + (item.product.delivery_fee || 0),
        0
      );
      const totalAmount = subtotal + deliveryFee;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          restaurant_id: user.id,
          total_amount: totalAmount,
          delivery_fee: deliveryFee,
          delivery_address: deliveryAddress,
          notes,
          status: "pending",
          branch_id: branchId || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        supplier_id: item.product.supplier_id,
        quantity: item.quantity,
        unit_price: item.product.price,
        status: "pending",
      }));

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

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { CartItem } from "@/contexts/CartContext";

interface CreateOrderParams {
  items: CartItem[];
  deliveryAddress?: string;
  notes?: string;
}

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ items, deliveryAddress, notes }: CreateOrderParams) => {
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

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

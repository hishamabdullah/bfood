import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface UpdateOrderItemParams {
  itemId: string;
  quantity: number;
  orderId: string;
}

interface DeleteSupplierItemsParams {
  orderId: string;
  supplierId: string;
}

interface DeleteOrderParams {
  orderId: string;
}

export const useOrderManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // تحديث كمية عنصر في الطلب
  const updateOrderItem = useMutation({
    mutationFn: async ({ itemId, quantity, orderId }: UpdateOrderItemParams) => {
      if (!user) throw new Error("غير مصرح");

      // جلب سعر العنصر الحالي
      const { data: item, error: fetchError } = await supabase
        .from("order_items")
        .select("unit_price, delivery_fee")
        .eq("id", itemId)
        .single();

      if (fetchError) throw fetchError;

      // تحديث الكمية
      const { error } = await supabase
        .from("order_items")
        .update({ quantity })
        .eq("id", itemId);

      if (error) throw error;

      // إعادة حساب إجمالي الطلب
      await recalculateOrderTotal(orderId);

      return { itemId, quantity };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-orders"] });
      toast({ title: "تم تحديث الكمية بنجاح" });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تحديث الكمية",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // حذف عناصر مورد معين من الطلب
  const deleteSupplierItems = useMutation({
    mutationFn: async ({ orderId, supplierId }: DeleteSupplierItemsParams) => {
      if (!user) throw new Error("غير مصرح");

      // حذف جميع عناصر المورد من الطلب
      const { error } = await supabase
        .from("order_items")
        .delete()
        .eq("order_id", orderId)
        .eq("supplier_id", supplierId);

      if (error) throw error;

      // التحقق إذا كان الطلب أصبح فارغاً
      const { data: remainingItems, error: countError } = await supabase
        .from("order_items")
        .select("id")
        .eq("order_id", orderId);

      if (countError) throw countError;

      // إذا لم يتبق عناصر، حذف الطلب بالكامل
      if (!remainingItems || remainingItems.length === 0) {
        const { error: deleteOrderError } = await supabase
          .from("orders")
          .delete()
          .eq("id", orderId);

        if (deleteOrderError) throw deleteOrderError;
        return { orderDeleted: true };
      }

      // إعادة حساب إجمالي الطلب
      await recalculateOrderTotal(orderId);
      return { orderDeleted: false };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-orders"] });
      if (data.orderDeleted) {
        toast({ title: "تم إلغاء الطلب بالكامل" });
      } else {
        toast({ title: "تم إلغاء طلب المورد بنجاح" });
      }
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إلغاء طلب المورد",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // حذف الطلب بالكامل
  const deleteOrder = useMutation({
    mutationFn: async ({ orderId }: DeleteOrderParams) => {
      if (!user) throw new Error("غير مصرح");

      // حذف جميع عناصر الطلب أولاً
      const { error: itemsError } = await supabase
        .from("order_items")
        .delete()
        .eq("order_id", orderId);

      if (itemsError) throw itemsError;

      // حذف الطلب
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);

      if (error) throw error;

      return { orderId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-orders"] });
      toast({ title: "تم إلغاء الطلب بالكامل" });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إلغاء الطلب",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // حذف عنصر واحد من الطلب
  const deleteOrderItem = useMutation({
    mutationFn: async ({ itemId, orderId }: { itemId: string; orderId: string }) => {
      if (!user) throw new Error("غير مصرح");

      // حذف العنصر
      const { error } = await supabase
        .from("order_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      // التحقق إذا كان الطلب أصبح فارغاً
      const { data: remainingItems, error: countError } = await supabase
        .from("order_items")
        .select("id")
        .eq("order_id", orderId);

      if (countError) throw countError;

      // إذا لم يتبق عناصر، حذف الطلب بالكامل
      if (!remainingItems || remainingItems.length === 0) {
        const { error: deleteOrderError } = await supabase
          .from("orders")
          .delete()
          .eq("id", orderId);

        if (deleteOrderError) throw deleteOrderError;
        return { orderDeleted: true };
      }

      // إعادة حساب إجمالي الطلب
      await recalculateOrderTotal(orderId);
      return { orderDeleted: false };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-orders"] });
      if (data.orderDeleted) {
        toast({ title: "تم إلغاء الطلب بالكامل" });
      } else {
        toast({ title: "تم حذف المنتج من الطلب" });
      }
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حذف المنتج",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    updateOrderItem,
    deleteSupplierItems,
    deleteOrder,
    deleteOrderItem,
  };
};

// دالة مساعدة لإعادة حساب إجمالي الطلب
async function recalculateOrderTotal(orderId: string) {
  // جلب جميع عناصر الطلب
  const { data: items, error: fetchError } = await supabase
    .from("order_items")
    .select("quantity, unit_price, delivery_fee")
    .eq("order_id", orderId);

  if (fetchError) throw fetchError;

  // حساب الإجمالي الجديد
  let totalAmount = 0;
  let totalDeliveryFee = 0;

  items?.forEach((item) => {
    totalAmount += item.quantity * item.unit_price;
    totalDeliveryFee += item.delivery_fee || 0;
  });

  // تحديث الطلب
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      total_amount: totalAmount + totalDeliveryFee,
      delivery_fee: totalDeliveryFee,
    })
    .eq("id", orderId);

  if (updateError) throw updateError;
}

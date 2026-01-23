import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type SupplierOrderItem = Tables<"order_items"> & {
  product?: Tables<"products"> | null;
  order?: (Tables<"orders"> & {
    restaurant_profile?: Tables<"profiles"> | null;
  }) | null;
};

export const useSupplierOrders = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["supplier-orders", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get order items for this supplier
      const { data: orderItems, error } = await supabase
        .from("order_items")
        .select(`
          *,
          product:products(*),
          order:orders(*)
        `)
        .eq("supplier_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get restaurant profiles for orders
      const restaurantIds = [...new Set(orderItems?.map(item => item.order?.restaurant_id).filter(Boolean) || [])];
      
      let profiles: Tables<"profiles">[] = [];
      if (restaurantIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("*")
          .in("user_id", restaurantIds);
        profiles = profilesData || [];
      }

      // Map profiles to order items
      const itemsWithProfiles = orderItems?.map(item => ({
        ...item,
        order: item.order ? {
          ...item.order,
          restaurant_profile: profiles.find(p => p.user_id === item.order?.restaurant_id) || null,
        } : null,
      })) || [];

      return itemsWithProfiles as SupplierOrderItem[];
    },
    enabled: !!user,
  });
};

export const useUpdateOrderItemStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, status }: { itemId: string; status: string }) => {
      const { data, error } = await supabase
        .from("order_items")
        .update({ status })
        .eq("id", itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-orders"] });
      toast.success("تم تحديث حالة الطلب");
    },
    onError: (error) => {
      console.error("Error updating order status:", error);
      toast.error("حدث خطأ أثناء تحديث الحالة");
    },
  });
};

// Update all items in an order for a specific supplier and update main order status
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      if (!user) throw new Error("يجب تسجيل الدخول");

      // تحديث حالة جميع عناصر الطلب للمورد
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .update({ status })
        .eq("order_id", orderId)
        .eq("supplier_id", user.id)
        .select();

      if (itemsError) throw itemsError;

      // تحديث حالة الطلب الرئيسي
      const { error: orderError } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId);

      if (orderError) throw orderError;

      // إرسال إشعار للمطعم بتغيير حالة الطلب
      const { data: order } = await supabase
        .from("orders")
        .select("restaurant_id")
        .eq("id", orderId)
        .maybeSingle();

      if (order?.restaurant_id) {
        const statusLabels: Record<string, string> = {
          pending: "في الانتظار",
          confirmed: "مؤكد",
          preparing: "قيد التحضير",
          shipped: "تم الشحن",
          delivered: "تم التوصيل",
          cancelled: "ملغي",
        };

        const supplierName = profile?.business_name || "المورد";
        
        await supabase.from("notifications").insert({
          user_id: order.restaurant_id,
          title: "تحديث حالة الطلب",
          message: `قام ${supplierName} بتحديث حالة طلبك إلى: ${statusLabels[status] || status}`,
          type: "status_update",
          order_id: orderId,
        });
      }

      return items;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-orders"] });
      queryClient.invalidateQueries({ queryKey: ["restaurant-orders"] });
      toast.success("تم تحديث حالة الطلب");
    },
    onError: (error) => {
      console.error("Error updating order status:", error);
      toast.error("حدث خطأ أثناء تحديث الحالة");
    },
  });
};

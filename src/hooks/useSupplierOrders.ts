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

// Update all items in an order for a specific supplier
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      if (!user) throw new Error("يجب تسجيل الدخول");

      const { data, error } = await supabase
        .from("order_items")
        .update({ status })
        .eq("order_id", orderId)
        .eq("supplier_id", user.id)
        .select();

      if (error) throw error;
      return data;
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

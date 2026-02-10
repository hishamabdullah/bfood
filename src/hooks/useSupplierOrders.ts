import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { dynamicQueryOptions } from "@/lib/queryConfig";

export type SupplierOrderItem = Omit<Tables<"order_items">, 'product_id'> & {
  product_id: string;
  delivery_type?: string | null;
  delivery_agent_id?: string | null;
  product?: Pick<Tables<"products">, "id" | "name" | "image_url" | "unit" | "price" | "sku"> | null;
  delivery_agent?: {
    id: string;
    name: string;
    phone: string | null;
    bank_name: string | null;
    bank_account_name: string | null;
    bank_iban: string | null;
  } | null;
  order?: (Tables<"orders"> & {
    restaurant_profile?: Tables<"profiles"> | null;
    branch?: Tables<"branches"> | null;
  }) | null;
};

export const useSupplierOrders = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Realtime subscription للتحديثات الفورية
  useEffect(() => {
    if (!user) return;

    // الاستماع لتغييرات عناصر الطلبات
    const orderItemsChannel = supabase
      .channel('supplier-order-items-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
          filter: `supplier_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Order items changed:', payload);
          queryClient.invalidateQueries({ queryKey: ["supplier-orders"] });
          
          // إظهار إشعار عند الحذف أو التعديل
          if (payload.eventType === 'DELETE') {
            toast.info("تم تعديل طلب من قبل المطعم");
          } else if (payload.eventType === 'UPDATE') {
            const oldData = payload.old as any;
            const newData = payload.new as any;
            if (oldData.quantity !== newData.quantity) {
              toast.info("تم تعديل كمية في طلب");
            }
          }
        }
      )
      .subscribe();

    // الاستماع لتغييرات الطلبات الرئيسية
    const ordersChannel = supabase
      .channel('supplier-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('Orders changed:', payload);
          queryClient.invalidateQueries({ queryKey: ["supplier-orders"] });
          
          if (payload.eventType === 'DELETE') {
            toast.info("تم إلغاء طلب من قبل المطعم");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(orderItemsChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, [user, queryClient]);

  return useQuery({
    queryKey: ["supplier-orders", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get order items for this supplier - select only needed fields including restaurant_id
      const { data: orderItems, error } = await supabase
        .from("order_items")
        .select(`
          id,
          order_id,
          product_id,
          supplier_id,
          quantity,
          unit_price,
          status,
          delivery_fee,
          invoice_url,
          delivery_type,
          delivery_agent_id,
          created_at,
          product:products(id, name, image_url, unit, price, sku),
          order:orders(id, restaurant_id, status, total_amount, delivery_fee, delivery_address, notes, created_at, is_pickup, branch:branches(id, name, address, google_maps_url)),
          delivery_agent:delivery_agents(id, name, phone, bank_name, bank_account_name, bank_iban)
        `)
        .eq("supplier_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get restaurant profiles for orders - extract restaurant_id properly
      const restaurantIds = [...new Set(
        orderItems?.map(item => (item.order as any)?.restaurant_id).filter(Boolean) || []
      )];
      
      if (restaurantIds.length === 0) return orderItems as SupplierOrderItem[];
      
      // استخدام الدالة الآمنة لجلب بيانات المطاعم
      const profilePromises = restaurantIds.map(async (restaurantId) => {
        const { data } = await supabase.rpc('get_restaurant_profile_for_order', {
          _restaurant_id: restaurantId
        });
        return data?.[0] || null;
      });
      
      const profileResults = await Promise.all(profilePromises);
      
      // Create a map for faster lookups
      const profileMap = new Map<string, any>();
      profileResults.forEach((profile) => {
        if (profile) {
          profileMap.set(profile.user_id, profile);
        }
      });

      // Map profiles to order items
      const itemsWithProfiles = orderItems?.map(item => {
        const orderData = item.order as any;
        const restaurantId = orderData?.restaurant_id;
        return {
          ...item,
          order: orderData ? {
            ...orderData,
            restaurant_profile: restaurantId ? profileMap.get(restaurantId) : null,
            branch: orderData.branch || null,
          } : null,
        };
      }) || [];

      return itemsWithProfiles as SupplierOrderItem[];
    },
    enabled: !!user,
    ...dynamicQueryOptions,
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

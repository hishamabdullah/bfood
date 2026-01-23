import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useRealtimeNotifications = () => {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();
  const bellAudioRef = useRef<HTMLAudioElement | null>(null);
  const toneAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio elements
    bellAudioRef.current = new Audio("/sounds/notification-bell.mp3");
    toneAudioRef.current = new Audio("/sounds/notification-tone.mp3");
    
    // Preload audio
    bellAudioRef.current.load();
    toneAudioRef.current.load();

    return () => {
      bellAudioRef.current = null;
      toneAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    // الاستماع للإشعارات الجديدة
    const notificationsChannel = supabase
      .channel("realtime-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as any;
          
          // تشغيل الصوت حسب نوع المستخدم
          if (userRole === "supplier" && notification.type === "order") {
            // صوت الجرس للمورد عند طلب جديد
            bellAudioRef.current?.play().catch(console.error);
            toast.success(notification.title, {
              description: notification.message,
            });
          } else if (userRole === "restaurant" && notification.type === "status_update") {
            // صوت النغمة للمطعم عند تغيير الحالة
            toneAudioRef.current?.play().catch(console.error);
            toast.info(notification.title, {
              description: notification.message,
            });
          }

          // تحديث الإشعارات
          queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
        }
      )
      .subscribe();

    // الاستماع لتحديثات الطلبات للمطعم
    const ordersChannel = supabase
      .channel("realtime-orders")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
        },
        () => {
          // تحديث قائمة الطلبات
          queryClient.invalidateQueries({ queryKey: ["restaurant-orders"] });
        }
      )
      .subscribe();

    // الاستماع لتحديثات عناصر الطلبات للمورد
    const orderItemsChannel = supabase
      .channel("realtime-order-items")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_items",
        },
        () => {
          // تحديث قائمة الطلبات
          queryClient.invalidateQueries({ queryKey: ["supplier-orders"] });
          queryClient.invalidateQueries({ queryKey: ["restaurant-orders"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(orderItemsChannel);
    };
  }, [user, userRole, queryClient]);
};

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
  const paymentChimeRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayedRef = useRef<number>(0);
  const processedNotificationsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Initialize audio elements
    const bellAudio = new Audio("/sounds/notification-bell.mp3");
    const toneAudio = new Audio("/sounds/notification-tone.mp3");
    const paymentChime = new Audio("/sounds/payment-chime.mp3");
    
    // Preload audio
    bellAudio.load();
    toneAudio.load();
    paymentChime.load();
    
    // Set payment chime volume lower for softer sound
    paymentChime.volume = 0.6;
    
    bellAudioRef.current = bellAudio;
    toneAudioRef.current = toneAudio;
    paymentChimeRef.current = paymentChime;

    return () => {
      // Properly cleanup audio elements
      if (bellAudioRef.current) {
        bellAudioRef.current.pause();
        bellAudioRef.current.src = "";
        bellAudioRef.current = null;
      }
      if (toneAudioRef.current) {
        toneAudioRef.current.pause();
        toneAudioRef.current.src = "";
        toneAudioRef.current = null;
      }
      if (paymentChimeRef.current) {
        paymentChimeRef.current.pause();
        paymentChimeRef.current.src = "";
        paymentChimeRef.current = null;
      }
      processedNotificationsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    // إيقاف جميع الأصوات
    const stopAllSounds = () => {
      if (bellAudioRef.current) {
        bellAudioRef.current.pause();
        bellAudioRef.current.currentTime = 0;
      }
      if (toneAudioRef.current) {
        toneAudioRef.current.pause();
        toneAudioRef.current.currentTime = 0;
      }
      if (paymentChimeRef.current) {
        paymentChimeRef.current.pause();
        paymentChimeRef.current.currentTime = 0;
      }
    };

    // تشغيل الصوت مع منع التكرار
    const playSound = (audioRef: React.RefObject<HTMLAudioElement | null>) => {
      const now = Date.now();
      // منع تشغيل الصوت إذا تم تشغيله خلال آخر 500 مللي ثانية
      if (now - lastPlayedRef.current < 500) {
        return;
      }
      lastPlayedRef.current = now;
      stopAllSounds();
      audioRef.current?.play().catch(console.error);
    };

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
          
          // تجاهل الإشعارات التي تمت معالجتها مسبقاً
          if (processedNotificationsRef.current.has(notification.id)) {
            return;
          }
          processedNotificationsRef.current.add(notification.id);
          
          // تنظيف الإشعارات القديمة من الذاكرة (الاحتفاظ بآخر 50 فقط)
          if (processedNotificationsRef.current.size > 50) {
            const entries = Array.from(processedNotificationsRef.current);
            processedNotificationsRef.current = new Set(entries.slice(-50));
          }
          
          // تشغيل الصوت حسب نوع المستخدم
          if (userRole === "supplier" && notification.type === "order") {
            // صوت الجرس للمورد عند طلب جديد
            playSound(bellAudioRef);
            toast.success(notification.title, {
              description: notification.message,
            });
          } else if (userRole === "supplier" && notification.type === "payment") {
            // صوت أخف للمورد عند إشعار دفع
            playSound(paymentChimeRef);
            toast.success(notification.title, {
              description: notification.message,
            });
            // تحديث بيانات الدفعات للمورد فوراً
            queryClient.invalidateQueries({ queryKey: ["supplier-payments", user.id] });
          } else if (userRole === "restaurant" && notification.type === "status_update") {
            // صوت النغمة للمطعم عند تغيير الحالة
            playSound(toneAudioRef);
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

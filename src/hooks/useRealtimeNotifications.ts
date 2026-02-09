import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUserSettings } from "@/hooks/useUserSettings";

export const useRealtimeNotifications = () => {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();
  const { data: userSettings } = useUserSettings();
  const bellAudioRef = useRef<HTMLAudioElement | null>(null);
  const bubbleAudioRef = useRef<HTMLAudioElement | null>(null);
  const paymentChimeRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayedRef = useRef<number>(0);
  const processedNotificationsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Initialize audio elements
    const bellAudio = new Audio("/sounds/notification-bell.mp3");
    const bubbleAudio = new Audio("/sounds/bubble-notification.mp3");
    const paymentChime = new Audio("/sounds/payment-chime.mp3");
    
    // Preload audio
    bellAudio.load();
    bubbleAudio.load();
    paymentChime.load();
    
    // Set payment chime volume lower for softer sound
    paymentChime.volume = 0.6;
    bubbleAudio.volume = 0.7;
    
    bellAudioRef.current = bellAudio;
    bubbleAudioRef.current = bubbleAudio;
    paymentChimeRef.current = paymentChime;

    return () => {
      // Properly cleanup audio elements
      if (bellAudioRef.current) {
        bellAudioRef.current.pause();
        bellAudioRef.current.src = "";
        bellAudioRef.current = null;
      }
      if (bubbleAudioRef.current) {
        bubbleAudioRef.current.pause();
        bubbleAudioRef.current.src = "";
        bubbleAudioRef.current = null;
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
      if (bubbleAudioRef.current) {
        bubbleAudioRef.current.pause();
        bubbleAudioRef.current.currentTime = 0;
      }
      if (paymentChimeRef.current) {
        paymentChimeRef.current.pause();
        paymentChimeRef.current.currentTime = 0;
      }
    };

    // تشغيل الصوت مع منع التكرار (يحترم إعداد الصوت)
    const playSound = (audioRef: React.RefObject<HTMLAudioElement | null>) => {
      // تحقق من تفعيل الصوت - إذا لم يكن هناك إعداد، افترض تفعيل الصوت
      if (userSettings?.sound_enabled === false) {
        console.log("Sound disabled by user settings");
        return;
      }
      
      const now = Date.now();
      // منع تشغيل الصوت إذا تم تشغيله خلال آخر 500 مللي ثانية
      if (now - lastPlayedRef.current < 500) {
        console.log("Sound throttled - too soon after last play");
        return;
      }
      lastPlayedRef.current = now;
      stopAllSounds();
      
      // تأكد من أن الصوت جاهز للتشغيل
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => console.log("Sound played successfully"))
            .catch((err) => {
              console.error("Failed to play sound:", err);
              // محاولة تشغيل الصوت بعد تفاعل المستخدم
            });
        }
      }
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
            // صوت فقاعي ناعم للمطعم عند تغيير الحالة
            playSound(bubbleAudioRef);
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

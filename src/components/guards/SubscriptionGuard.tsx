import { ReactNode, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRestaurantSubscription } from "@/hooks/useRestaurantSubscription";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface SubscriptionGuardProps {
  children: ReactNode;
}

// الصفحات المستثناة من التحقق (يمكن الوصول إليها حتى مع انتهاء الاشتراك)
const EXEMPT_PATHS = [
  "/subscription-expired",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/pending-approval",
  "/profile",
  "/privacy",
  "/terms",
  "/contact",
];

const SubscriptionGuard = ({ children }: SubscriptionGuardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole, loading: authLoading } = useAuth();
  const { data: subscription, isLoading: subscriptionLoading } = useRestaurantSubscription();
  const isRedirectingRef = useRef(false);

  const isExemptPath = EXEMPT_PATHS.some(path => 
    location.pathname === path || location.pathname.startsWith(path + "/")
  );

  // دالة تسجيل الخروج والتوجيه لصفحة انتهاء الاشتراك
  const handleExpiredInteraction = useCallback(async () => {
    if (isRedirectingRef.current) return;
    isRedirectingRef.current = true;

    try {
      // تسجيل الخروج
      await supabase.auth.signOut();
      
      // تنظيف التخزين المحلي
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("sb-")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      sessionStorage.clear();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      // التوجيه لصفحة انتهاء الاشتراك
      window.location.href = "/subscription-expired";
    }
  }, []);

  // اعتراض أي نقرة عند انتهاء الاشتراك
  useEffect(() => {
    if (authLoading || subscriptionLoading) return;
    if (!user || userRole !== "restaurant") return;
    if (isExemptPath) return;

    const isExpired = subscription && (subscription.isExpired || !subscription.isActive);
    
    if (!isExpired) return;

    const handleInteraction = (e: MouseEvent | TouchEvent | KeyboardEvent) => {
      // السماح بالنقر على روابط صفحة انتهاء الاشتراك فقط
      const target = e.target as HTMLElement;
      const isExemptLink = target.closest('a[href*="subscription-expired"]') || 
                           target.closest('a[href*="contact"]') ||
                           target.closest('a[href*="profile"]');
      
      if (isExemptLink) return;

      e.preventDefault();
      e.stopPropagation();
      handleExpiredInteraction();
    };

    // إضافة المستمعين لجميع أنواع التفاعل
    document.addEventListener("click", handleInteraction, true);
    document.addEventListener("touchstart", handleInteraction, true);
    document.addEventListener("keydown", handleInteraction, true);

    return () => {
      document.removeEventListener("click", handleInteraction, true);
      document.removeEventListener("touchstart", handleInteraction, true);
      document.removeEventListener("keydown", handleInteraction, true);
    };
  }, [
    authLoading,
    subscriptionLoading,
    user,
    userRole,
    subscription,
    isExemptPath,
    handleExpiredInteraction,
  ]);

  // التوجيه التلقائي عند انتهاء الاشتراك
  useEffect(() => {
    if (authLoading || subscriptionLoading) return;
    if (!user || userRole !== "restaurant") return;
    if (isExemptPath) return;

    if (subscription && (subscription.isExpired || !subscription.isActive)) {
      handleExpiredInteraction();
    }
  }, [
    authLoading,
    subscriptionLoading,
    user,
    userRole,
    subscription,
    isExemptPath,
    handleExpiredInteraction,
  ]);

  // إظهار التحميل فقط للمطاعم في الصفحات المحمية
  if (
    userRole === "restaurant" &&
    !isExemptPath &&
    (authLoading || subscriptionLoading)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
};

export default SubscriptionGuard;

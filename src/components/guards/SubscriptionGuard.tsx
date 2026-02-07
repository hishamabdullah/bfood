import { ReactNode, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRestaurantSubscription } from "@/hooks/useRestaurantSubscription";
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
  const { user, userRole, loading: authLoading, isSubUser, subUserInfo } = useAuth();
  const { data: subscription, isLoading: subscriptionLoading } = useRestaurantSubscription();
  const isRedirectingRef = useRef(false);

  // التحقق: المستخدم الفرعي يُعامل كمطعم
  const isRestaurantUser = userRole === "restaurant" || isSubUser;

  const isExemptPath = EXEMPT_PATHS.some(path => 
    location.pathname === path || location.pathname.startsWith(path + "/")
  );

  // دالة التوجيه لصفحة انتهاء الاشتراك (بدون تسجيل خروج فوري)
  const handleExpiredRedirect = useCallback(() => {
    if (isRedirectingRef.current) return;
    isRedirectingRef.current = true;
    
    // التوجيه لصفحة انتهاء الاشتراك أولاً
    navigate("/subscription-expired", { replace: true });
  }, [navigate]);

  // اعتراض أي نقرة عند انتهاء الاشتراك
  useEffect(() => {
    if (authLoading || subscriptionLoading) return;
    if (!user || !isRestaurantUser) return;
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
      handleExpiredRedirect();
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
    handleExpiredRedirect,
  ]);

  // التوجيه التلقائي عند انتهاء الاشتراك
  useEffect(() => {
    if (authLoading || subscriptionLoading) return;
    if (!user || !isRestaurantUser) return;
    if (isExemptPath) return;

    if (subscription && (subscription.isExpired || !subscription.isActive)) {
      handleExpiredRedirect();
    }
  }, [
    authLoading,
    subscriptionLoading,
    user,
    userRole,
    subscription,
    isExemptPath,
    handleExpiredRedirect,
  ]);

  // إظهار التحميل فقط للمطاعم في الصفحات المحمية
  // لا نعرض التحميل إذا انتهى تحميل المصادقة وتبين أن المستخدم ليس مطعماً
  if (
    isRestaurantUser &&
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

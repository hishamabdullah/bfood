import { ReactNode, useEffect } from "react";
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
  const { user, userRole, loading: authLoading } = useAuth();
  const { data: subscription, isLoading: subscriptionLoading } = useRestaurantSubscription();

  const isExemptPath = EXEMPT_PATHS.some(path => 
    location.pathname === path || location.pathname.startsWith(path + "/")
  );

  useEffect(() => {
    // انتظر حتى ينتهي التحميل
    if (authLoading || subscriptionLoading) return;

    // لا تتحقق إذا لم يكن هناك مستخدم أو ليس مطعم
    if (!user || userRole !== "restaurant") return;

    // لا تتحقق في الصفحات المستثناة
    if (isExemptPath) return;

    // إذا انتهى الاشتراك أو الحساب غير نشط، أعد التوجيه
    if (subscription && (subscription.isExpired || !subscription.isActive)) {
      navigate("/subscription-expired", { replace: true });
    }
  }, [
    authLoading,
    subscriptionLoading,
    user,
    userRole,
    subscription,
    isExemptPath,
    navigate,
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

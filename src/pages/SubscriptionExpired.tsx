import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarX2, Phone, Mail, RefreshCw, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useRestaurantSubscription } from "@/hooks/useRestaurantSubscription";

const SubscriptionExpired = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { signOut, user, userRole, loading: authLoading } = useAuth();
  const { data: subscription, refetch, isRefetching } = useRestaurantSubscription();

  // إذا لم يكن هناك مستخدم (تم تسجيل الخروج بالفعل)، اعرض الصفحة بدون تحويل
  // إذا كان المستخدم مسجل وليس مطعم، حوّله للصفحة الرئيسية
  if (!authLoading && user && userRole && userRole !== "restaurant") {
    navigate("/");
    return null;
  }

  // إذا تم تجديد الاشتراك، أعد التوجيه
  if (subscription && !subscription.isExpired && subscription.isActive) {
    navigate("/products");
    return null;
  }

  const handleRefresh = async () => {
    await refetch();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString(i18n.language === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4 w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
              <CalendarX2 className="w-10 h-10 text-destructive" />
            </div>
            <CardTitle className="text-2xl text-destructive">
              انتهى اشتراكك
            </CardTitle>
            <CardDescription className="text-base">
              نأسف، لقد انتهت صلاحية اشتراكك ولا يمكنك الوصول للنظام حالياً
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* تفاصيل الاشتراك - تظهر فقط إذا كان المستخدم مسجل */}
            {subscription && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">نوع الاشتراك:</span>
                  <span className="font-medium">
                    {subscription.subscriptionType === "basic" && "أساسي"}
                    {subscription.subscriptionType === "standard" && "عادي"}
                    {subscription.subscriptionType === "premium" && "متميز"}
                    {subscription.subscriptionType === "enterprise" && "مؤسسات"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">تاريخ الانتهاء:</span>
                  <span className="font-medium text-destructive">
                    {formatDate(subscription.subscriptionEndDate || null)}
                  </span>
                </div>
              </div>
            )}

            {/* رسالة التواصل */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-3">
                للتجديد أو الاستفسار، يرجى التواصل مع فريق الدعم:
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href="https://wa.me/966505897171"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 text-sm text-primary hover:underline"
                >
                  <Phone className="w-4 h-4" />
                  <span dir="ltr">+966 50 589 7171</span>
                </a>
                <a
                  href="mailto:support@bfood.sa"
                  className="inline-flex items-center justify-center gap-2 text-sm text-primary hover:underline"
                >
                  <Mail className="w-4 h-4" />
                  support@bfood.sa
                </a>
              </div>
            </div>

            {/* الأزرار */}
            <div className="flex flex-col gap-3">
              {user && (
                <Button
                  onClick={handleRefresh}
                  disabled={isRefetching}
                  className="w-full"
                >
                  {isRefetching ? (
                    <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 ml-2" />
                  )}
                  تحقق من حالة الاشتراك
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="w-full"
              >
                <LogOut className="w-4 h-4 ml-2" />
                {user ? "تسجيل الخروج" : "العودة لتسجيل الدخول"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default SubscriptionExpired;

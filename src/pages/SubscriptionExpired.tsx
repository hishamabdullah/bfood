import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CalendarX2,
  Phone,
  Mail,
  RefreshCw,
  LogOut,
  Upload,
  Banknote,
  Building,
  CreditCard,
  Copy,
  Check,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useRestaurantSubscription } from "@/hooks/useRestaurantSubscription";
import {
  useSubscriptionSettings,
  useMyRenewalRequest,
  useCreateRenewalRequest,
  uploadRenewalReceipt,
} from "@/hooks/useSubscriptionRenewals";
import { toast } from "sonner";

const SubscriptionExpired = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { signOut, user, userRole, loading: authLoading } = useAuth();
  const { data: subscription, refetch, isRefetching } = useRestaurantSubscription();
  const { data: settings, isLoading: settingsLoading } = useSubscriptionSettings();
  const { data: myRequest, isLoading: requestLoading } = useMyRenewalRequest();
  const createRenewal = useCreateRenewalRequest();

  const [isUploading, setIsUploading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success("تم النسخ");
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("فشل النسخ");
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id || !settings) return;

    // التحقق من حجم الملف (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت");
      return;
    }

    // التحقق من نوع الملف
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("نوع الملف غير مدعوم. استخدم صورة أو PDF");
      return;
    }

    setIsUploading(true);
    try {
      const receiptUrl = await uploadRenewalReceipt(file, user.id);
      await createRenewal.mutateAsync({
        amount: parseFloat(settings.subscription_price),
        subscriptionType: subscription?.subscriptionType || "basic",
        receiptUrl,
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("حدث خطأ أثناء رفع الإيصال");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString(i18n.language === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-amber-500 text-white">
            <Clock className="w-3 h-3 ml-1" />
            قيد المراجعة
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="w-3 h-3 ml-1" />
            تمت الموافقة
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 ml-1" />
            مرفوض
          </Badge>
        );
      default:
        return null;
    }
  };

  const isLoading = settingsLoading || requestLoading;
  const hasPendingRequest = myRequest?.status === "pending";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-6">
          {/* بطاقة انتهاء الاشتراك */}
          <Card className="text-center">
            <CardHeader className="pb-4">
              <div className="mx-auto mb-4 w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
                <CalendarX2 className="w-10 h-10 text-destructive" />
              </div>
              <CardTitle className="text-2xl text-destructive">انتهى اشتراكك</CardTitle>
              <CardDescription className="text-base">
                نأسف، لقد انتهت صلاحية اشتراكك ولا يمكنك الوصول للنظام حالياً
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* تفاصيل الاشتراك */}
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

              {/* أزرار التحقق والخروج */}
              <div className="flex flex-col gap-3">
                {user && (
                  <Button onClick={handleRefresh} disabled={isRefetching} className="w-full">
                    {isRefetching ? (
                      <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 ml-2" />
                    )}
                    تحقق من حالة الاشتراك
                  </Button>
                )}
                <Button variant="outline" onClick={handleSignOut} className="w-full">
                  <LogOut className="w-4 h-4 ml-2" />
                  {user ? "تسجيل الخروج" : "العودة لتسجيل الدخول"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* بطاقة التجديد */}
          {user && !isLoading && settings && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-primary" />
                  تجديد الاشتراك
                </CardTitle>
                <CardDescription>
                  قم بالتحويل البنكي ثم أرفق إيصال الدفع لتفعيل اشتراكك
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* مبلغ الاشتراك */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">مبلغ الاشتراك الشهري</p>
                  <p className="text-3xl font-bold text-primary">
                    {settings.subscription_price} <span className="text-lg">ر.س</span>
                  </p>
                </div>

                <Separator />

                {/* معلومات البنك */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    معلومات التحويل البنكي
                  </h4>

                  <div className="space-y-3">
                    {/* اسم البنك */}
                    <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                      <div>
                        <p className="text-xs text-muted-foreground">اسم البنك</p>
                        <p className="font-medium">{settings.subscription_bank_name}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(settings.subscription_bank_name, "bank")}
                      >
                        {copiedField === "bank" ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    {/* اسم صاحب الحساب */}
                    <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                      <div>
                        <p className="text-xs text-muted-foreground">اسم صاحب الحساب</p>
                        <p className="font-medium">{settings.subscription_bank_account_name}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          copyToClipboard(settings.subscription_bank_account_name, "name")
                        }
                      >
                        {copiedField === "name" ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    {/* رقم الآيبان */}
                    <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                      <div>
                        <p className="text-xs text-muted-foreground">رقم الآيبان (IBAN)</p>
                        <p className="font-medium font-mono text-sm" dir="ltr">
                          {settings.subscription_bank_iban}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(settings.subscription_bank_iban, "iban")}
                      >
                        {copiedField === "iban" ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* حالة الطلب أو رفع الإيصال */}
                {myRequest ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">حالة طلب التجديد</h4>
                      {getStatusBadge(myRequest.status)}
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">تاريخ الطلب:</span>
                        <span>{formatDate(myRequest.created_at)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">المبلغ:</span>
                        <span>{myRequest.amount} ر.س</span>
                      </div>
                      {myRequest.receipt_url && (
                        <div className="pt-2">
                          <a
                            href={myRequest.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            عرض الإيصال المرفق
                          </a>
                        </div>
                      )}
                      {myRequest.admin_notes && (
                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground">ملاحظات الإدارة:</p>
                          <p className="text-sm">{myRequest.admin_notes}</p>
                        </div>
                      )}
                    </div>

                    {myRequest.status === "rejected" && (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          يمكنك إرسال طلب جديد مع إيصال صحيح
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="w-full"
                        >
                          {isUploading ? (
                            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4 ml-2" />
                          )}
                          رفع إيصال جديد
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      إرفاق إيصال الدفع
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      بعد إتمام التحويل، قم برفع صورة الإيصال أو ملف PDF للتحقق وتفعيل اشتراكك
                    </p>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full"
                      size="lg"
                    >
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 ml-2" />
                      )}
                      رفع إيصال الدفع
                    </Button>
                  </div>
                )}

                <Separator />

                {/* معلومات التواصل */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    للاستفسار أو المساعدة، تواصل معنا:
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
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SubscriptionExpired;

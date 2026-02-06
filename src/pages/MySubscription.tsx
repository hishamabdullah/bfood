import { useState } from "react";
import { format, differenceInDays } from "date-fns";
import { ar } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  CreditCard,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  Upload,
  Copy,
  Building,
  Banknote,
  FileText,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useMyRestaurantFeatures } from "@/hooks/useRestaurantFeatures";
import {
  useSubscriptionSettings,
  useMyRenewalRequests,
  useSubmitRenewalRequest,
} from "@/hooks/useSubscriptionRenewals";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const MySubscription = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const { data: features, isLoading: featuresLoading } = useMyRestaurantFeatures();
  const { data: settings, isLoading: settingsLoading } = useSubscriptionSettings();
  const { data: renewals, isLoading: renewalsLoading, refetch: refetchRenewals } = useMyRenewalRequests();
  const submitRenewal = useSubmitRenewalRequest();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // التحقق من صلاحية الوصول
  if (userRole !== "restaurant") {
    navigate("/");
    return null;
  }

  const isLoading = featuresLoading || settingsLoading || renewalsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  const subscriptionEndDate = features?.subscription_end_date
    ? new Date(features.subscription_end_date)
    : null;
  const now = new Date();
  const daysRemaining = subscriptionEndDate ? differenceInDays(subscriptionEndDate, now) : 0;
  const isExpired = subscriptionEndDate ? subscriptionEndDate < now : false;
  const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;

  // حساب نسبة التقدم (افتراض 30 يوم للشهر)
  const progressPercent = Math.max(0, Math.min(100, (daysRemaining / 30) * 100));

  const hasPendingRequest = renewals?.some((r) => r.status === "pending");

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `تم نسخ ${label}` });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "حجم الملف كبير جداً", description: "الحد الأقصى 5 ميجابايت", variant: "destructive" });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmitRenewal = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    try {
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("subscription-receipts")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("subscription-receipts")
        .getPublicUrl(fileName);

      await submitRenewal.mutateAsync({
        amount: parseFloat(settings?.subscription_price || "0"),
        receiptUrl: urlData.publicUrl,
      });

      setSelectedFile(null);
      refetchRenewals();
      toast({ title: "تم إرسال طلب التجديد بنجاح", description: "سيتم مراجعة طلبك قريباً" });
    } catch (error: any) {
      toast({ title: "حدث خطأ", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center gap-3 mb-8">
            <CreditCard className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">اشتراكي</h1>
              <p className="text-muted-foreground">إدارة اشتراكك ومتابعة طلبات التجديد</p>
            </div>
          </div>

          <div className="grid gap-6">
            {/* حالة الاشتراك */}
            <Card className={isExpired ? "border-destructive" : isExpiringSoon ? "border-amber-500" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  حالة الاشتراك
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">الحالة</span>
                  {isExpired ? (
                    <Badge variant="destructive" className="text-base px-4 py-1">
                      <AlertTriangle className="w-4 h-4 ml-2" />
                      منتهي
                    </Badge>
                  ) : isExpiringSoon ? (
                    <Badge className="bg-amber-500 text-white text-base px-4 py-1">
                      <Clock className="w-4 h-4 ml-2" />
                      ينتهي قريباً
                    </Badge>
                  ) : (
                    <Badge className="bg-green-500 text-white text-base px-4 py-1">
                      <CheckCircle className="w-4 h-4 ml-2" />
                      نشط
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">تاريخ انتهاء الاشتراك</span>
                  <span className="font-bold text-lg">
                    {subscriptionEndDate
                      ? format(subscriptionEndDate, "dd MMMM yyyy", { locale: ar })
                      : "غير محدد"}
                  </span>
                </div>

                {!isExpired && subscriptionEndDate && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>الأيام المتبقية</span>
                      <span className="font-medium">{daysRemaining} يوم</span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                  </div>
                )}

                {isExpired && (
                  <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
                    <p className="font-medium">انتهى اشتراكك!</p>
                    <p className="text-sm mt-1">يرجى تجديد الاشتراك للاستمرار في استخدام جميع الميزات.</p>
                  </div>
                )}

                {isExpiringSoon && (
                  <div className="bg-amber-500/10 text-amber-700 p-4 rounded-lg">
                    <p className="font-medium">اشتراكك على وشك الانتهاء!</p>
                    <p className="text-sm mt-1">يرجى تجديد الاشتراك قبل انتهاء المدة لتجنب انقطاع الخدمة.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* معلومات التجديد */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="w-5 h-5" />
                  تجديد الاشتراك
                </CardTitle>
                <CardDescription>
                  قم بالتحويل البنكي ثم ارفق صورة الإيصال
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* سعر الاشتراك */}
                <div className="bg-primary/10 rounded-xl p-6 text-center">
                  <p className="text-muted-foreground mb-2">قيمة الاشتراك الشهري</p>
                  <p className="text-4xl font-bold text-primary">
                    {settings?.subscription_price || "---"} <span className="text-xl">ر.س</span>
                  </p>
                </div>

                {/* معلومات البنك */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    معلومات الحساب البنكي
                  </h4>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">البنك</span>
                      <span className="font-medium">{settings?.subscription_bank_name || "---"}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">اسم صاحب الحساب</span>
                      <span className="font-medium">{settings?.subscription_bank_account_name || "---"}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">الآيبان</span>
                      <div className="flex items-center gap-2">
                        <code className="bg-background px-2 py-1 rounded text-sm font-mono" dir="ltr">
                          {settings?.subscription_bank_iban || "---"}
                        </code>
                        {settings?.subscription_bank_iban && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => copyToClipboard(settings.subscription_bank_iban, "الآيبان")}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* رفع الإيصال */}
                {hasPendingRequest ? (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-center">
                    <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="font-medium text-amber-700">لديك طلب تجديد قيد المراجعة</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      سيتم إشعارك عند الموافقة على طلبك
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Label htmlFor="receipt" className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      ارفق إيصال التحويل
                    </Label>
                    <Input
                      id="receipt"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="cursor-pointer"
                    />
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground">
                        الملف المحدد: {selectedFile.name}
                      </p>
                    )}
                    <Button
                      onClick={handleSubmitRenewal}
                      disabled={!selectedFile || isUploading}
                      className="w-full"
                      size="lg"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                          جاري الإرسال...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 ml-2" />
                          إرسال طلب التجديد
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* سجل الطلبات */}
            {renewals && renewals.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      سجل طلبات التجديد
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => refetchRenewals()}>
                      <RefreshCw className="w-4 h-4 ml-1" />
                      تحديث
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {renewals.map((renewal) => (
                      <div
                        key={renewal.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(renewal.status)}
                            <span className="font-medium">{renewal.amount} ر.س</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(renewal.created_at), "dd MMM yyyy - HH:mm", { locale: ar })}
                          </p>
                          {renewal.admin_notes && (
                            <p className="text-sm text-muted-foreground">
                              ملاحظات: {renewal.admin_notes}
                            </p>
                          )}
                        </div>
                        {renewal.receipt_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(renewal.receipt_url!, "_blank")}
                          >
                            عرض الإيصال
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MySubscription;

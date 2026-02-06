import { useState } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Loader2,
  Settings,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Check,
  X,
  Building,
  Banknote,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useSubscriptionSettings,
  useUpdateSubscriptionSettings,
  useAllRenewalRequests,
  useUpdateRenewalStatus,
  SubscriptionRenewal,
} from "@/hooks/useSubscriptionRenewals";

const AdminSubscriptionManager = () => {
  const { data: settings, isLoading: settingsLoading } = useSubscriptionSettings();
  const { data: renewals, isLoading: renewalsLoading, refetch } = useAllRenewalRequests();
  const updateSettings = useUpdateSubscriptionSettings();
  const updateStatus = useUpdateRenewalStatus();

  const [editedSettings, setEditedSettings] = useState({
    subscription_price: "",
    subscription_bank_name: "",
    subscription_bank_account_name: "",
    subscription_bank_iban: "",
  });
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [selectedRenewal, setSelectedRenewal] = useState<SubscriptionRenewal | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: "approve" | "reject";
    renewal: SubscriptionRenewal | null;
  }>({ open: false, action: "approve", renewal: null });
  const [adminNotes, setAdminNotes] = useState("");
  const [subscriptionMonths, setSubscriptionMonths] = useState("1");

  const pendingRenewals = renewals?.filter((r) => r.status === "pending") || [];
  const processedRenewals = renewals?.filter((r) => r.status !== "pending") || [];

  const handleEditSettings = () => {
    if (settings) {
      setEditedSettings({
        subscription_price: settings.subscription_price,
        subscription_bank_name: settings.subscription_bank_name,
        subscription_bank_account_name: settings.subscription_bank_account_name,
        subscription_bank_iban: settings.subscription_bank_iban,
      });
      setIsEditingSettings(true);
    }
  };

  const handleSaveSettings = async () => {
    await updateSettings.mutateAsync(editedSettings);
    setIsEditingSettings(false);
  };

  const handleAction = (renewal: SubscriptionRenewal, action: "approve" | "reject") => {
    setActionDialog({ open: true, action, renewal });
    setAdminNotes("");
    setSubscriptionMonths("1");
  };

  const handleConfirmAction = async () => {
    if (!actionDialog.renewal) return;

    await updateStatus.mutateAsync({
      renewalId: actionDialog.renewal.id,
      status: actionDialog.action === "approve" ? "approved" : "rejected",
      adminNotes: adminNotes || undefined,
      restaurantId: actionDialog.renewal.restaurant_id,
      subscriptionMonths:
        actionDialog.action === "approve" ? parseInt(subscriptionMonths) : undefined,
    });

    setActionDialog({ open: false, action: "approve", renewal: null });
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

  if (settingsLoading || renewalsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* إعدادات الاشتراك */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                إعدادات الاشتراك
              </CardTitle>
              <CardDescription>
                تحديد سعر الاشتراك ومعلومات الحساب البنكي للتحويل
              </CardDescription>
            </div>
            {!isEditingSettings && (
              <Button onClick={handleEditSettings}>
                <Settings className="w-4 h-4 ml-2" />
                تعديل الإعدادات
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditingSettings ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="price">سعر الاشتراك الشهري (ر.س)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={editedSettings.subscription_price}
                    onChange={(e) =>
                      setEditedSettings({ ...editedSettings, subscription_price: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="bank">اسم البنك</Label>
                  <Input
                    id="bank"
                    value={editedSettings.subscription_bank_name}
                    onChange={(e) =>
                      setEditedSettings({ ...editedSettings, subscription_bank_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="account">اسم صاحب الحساب</Label>
                  <Input
                    id="account"
                    value={editedSettings.subscription_bank_account_name}
                    onChange={(e) =>
                      setEditedSettings({
                        ...editedSettings,
                        subscription_bank_account_name: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="iban">رقم الآيبان (IBAN)</Label>
                  <Input
                    id="iban"
                    value={editedSettings.subscription_bank_iban}
                    onChange={(e) =>
                      setEditedSettings({ ...editedSettings, subscription_bank_iban: e.target.value })
                    }
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsEditingSettings(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleSaveSettings} disabled={updateSettings.isPending}>
                  {updateSettings.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                  حفظ الإعدادات
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Banknote className="w-4 h-4" />
                  سعر الاشتراك
                </div>
                <p className="text-2xl font-bold text-primary">{settings?.subscription_price} ر.س</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Building className="w-4 h-4" />
                  البنك
                </div>
                <p className="font-medium">{settings?.subscription_bank_name}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <CreditCard className="w-4 h-4" />
                  صاحب الحساب
                </div>
                <p className="font-medium">{settings?.subscription_bank_account_name}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <CreditCard className="w-4 h-4" />
                  الآيبان
                </div>
                <p className="font-medium font-mono text-sm" dir="ltr">
                  {settings?.subscription_bank_iban}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* طلبات التجديد */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              طلبات تجديد الاشتراك
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 ml-2" />
              تحديث
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="w-4 h-4" />
                قيد المراجعة ({pendingRenewals.length})
              </TabsTrigger>
              <TabsTrigger value="processed" className="gap-2">
                <CheckCircle className="w-4 h-4" />
                تمت المعالجة ({processedRenewals.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-4">
              {pendingRenewals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد طلبات قيد المراجعة
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">المطعم</TableHead>
                        <TableHead className="text-right">رقم العميل</TableHead>
                        <TableHead className="text-right">المبلغ</TableHead>
                        <TableHead className="text-right">تاريخ الطلب</TableHead>
                        <TableHead className="text-right">الإيصال</TableHead>
                        <TableHead className="text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingRenewals.map((renewal) => (
                        <TableRow key={renewal.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {renewal.restaurant?.business_name || "-"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {renewal.restaurant?.full_name}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              #{renewal.restaurant?.customer_code || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{renewal.amount} ر.س</TableCell>
                          <TableCell>
                            {format(new Date(renewal.created_at), "dd MMM yyyy HH:mm", {
                              locale: ar,
                            })}
                          </TableCell>
                          <TableCell>
                            {renewal.receipt_url ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedRenewal(renewal)}
                              >
                                <Eye className="w-4 h-4 ml-1" />
                                عرض
                              </Button>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleAction(renewal, "approve")}
                              >
                                <Check className="w-4 h-4 ml-1" />
                                موافقة
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleAction(renewal, "reject")}
                              >
                                <X className="w-4 h-4 ml-1" />
                                رفض
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="processed" className="mt-4">
              {processedRenewals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد طلبات معالجة
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">المطعم</TableHead>
                        <TableHead className="text-right">المبلغ</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">تاريخ الطلب</TableHead>
                        <TableHead className="text-right">الملاحظات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedRenewals.map((renewal) => (
                        <TableRow key={renewal.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {renewal.restaurant?.business_name || "-"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                #{renewal.restaurant?.customer_code}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{renewal.amount} ر.س</TableCell>
                          <TableCell>{getStatusBadge(renewal.status)}</TableCell>
                          <TableCell>
                            {format(new Date(renewal.created_at), "dd MMM yyyy", { locale: ar })}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {renewal.admin_notes || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* نافذة عرض الإيصال */}
      <Dialog open={!!selectedRenewal} onOpenChange={() => setSelectedRenewal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>إيصال الدفع</DialogTitle>
          </DialogHeader>
          {selectedRenewal?.receipt_url && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المطعم:</span>
                  <span className="font-medium">
                    {selectedRenewal.restaurant?.business_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المبلغ:</span>
                  <span className="font-medium">{selectedRenewal.amount} ر.س</span>
                </div>
              </div>
              <div className="border rounded-lg overflow-hidden">
                {selectedRenewal.receipt_url.endsWith(".pdf") ? (
                  <iframe
                    src={selectedRenewal.receipt_url}
                    className="w-full h-[500px]"
                    title="Receipt"
                  />
                ) : (
                  <img
                    src={selectedRenewal.receipt_url}
                    alt="Receipt"
                    className="w-full max-h-[500px] object-contain"
                  />
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => window.open(selectedRenewal.receipt_url!, "_blank")}
                >
                  فتح في نافذة جديدة
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* نافذة تأكيد الإجراء */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ ...actionDialog, open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === "approve" ? "تأكيد الموافقة" : "تأكيد الرفض"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {actionDialog.action === "approve" && (
              <div>
                <Label>مدة الاشتراك</Label>
                <Select value={subscriptionMonths} onValueChange={setSubscriptionMonths}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">شهر واحد</SelectItem>
                    <SelectItem value="3">3 أشهر</SelectItem>
                    <SelectItem value="6">6 أشهر</SelectItem>
                    <SelectItem value="12">سنة كاملة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>ملاحظات (اختياري)</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={
                  actionDialog.action === "approve"
                    ? "مثال: تم التحقق من الإيصال"
                    : "مثال: الإيصال غير واضح"
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ ...actionDialog, open: false })}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={updateStatus.isPending}
              className={actionDialog.action === "approve" ? "bg-green-600 hover:bg-green-700" : ""}
              variant={actionDialog.action === "reject" ? "destructive" : "default"}
            >
              {updateStatus.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              {actionDialog.action === "approve" ? "تأكيد الموافقة" : "تأكيد الرفض"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSubscriptionManager;

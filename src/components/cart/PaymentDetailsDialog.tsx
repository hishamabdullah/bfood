import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Copy, Check, Loader2, Banknote, Building, User, Upload, Image, AlertTriangle, UserRound, Phone, Truck, Store } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SupplierBankDetails {
  bank_name?: string | null;
  bank_account_name?: string | null;
  bank_iban?: string | null;
}

interface DeliveryAgentInfo {
  id: string;
  name: string;
  phone: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_iban: string | null;
}

interface PaymentDetailsDialogProps {
  supplierId: string;
  supplierName: string;
  supplierProfile: SupplierBankDetails | null;
  amountToPay: number;
  orderId?: string;
  isConfirmed?: boolean;
  deliveryAgent?: DeliveryAgentInfo | null;
  deliveryFee?: number;
  subtotal?: number;
}

export const PaymentDetailsDialog = ({
  supplierId,
  supplierName,
  supplierProfile,
  amountToPay,
  orderId,
  isConfirmed = false,
  deliveryAgent,
  deliveryFee = 0,
  subtotal,
}: PaymentDetailsDialogProps) => {
  const { t } = useTranslation();
  const { user, profile, userRole } = useAuth();
  const queryClient = useQueryClient();
  const [isCopied, setIsCopied] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [open, setOpen] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bankName = (supplierProfile as any)?.bank_name;
  const bankAccountName = (supplierProfile as any)?.bank_account_name;
  const bankIban = (supplierProfile as any)?.bank_iban;

  const hasBankDetails = bankName || bankAccountName || bankIban;
  const hasAgent = deliveryAgent && deliveryFee > 0;
  const [isAgentIbanCopied, setIsAgentIbanCopied] = useState(false);

  const copyAgentIban = async () => {
    if (!deliveryAgent?.bank_iban) return;
    try {
      await navigator.clipboard.writeText(deliveryAgent.bank_iban);
      setIsAgentIbanCopied(true);
      toast.success(t("cart.ibanCopied"));
      setTimeout(() => setIsAgentIbanCopied(false), 2000);
    } catch {
      toast.error(t("common.error"));
    }
  };

  const copyIban = async () => {
    if (!bankIban) return;
    try {
      await navigator.clipboard.writeText(bankIban);
      setIsCopied(true);
      toast.success(t("cart.ibanCopied"));
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error(t("common.error"));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error(t("cart.onlyImages"));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t("cart.fileTooLarge"));
        return;
      }
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const notifySupplier = async () => {
    if (!user) return;

    // الحماية: إشعار الدفع يجب أن يرسله المطعم فقط
    if (userRole !== "restaurant") {
      toast.error("هذه الميزة متاحة للمطعم فقط");
      return;
    }

    // لازم يكون فيه طلب فعلي حتى نربط الدفع بالطلب
    if (!orderId) {
      toast.error("يجب إنشاء الطلب أولاً قبل إرسال إشعار الدفع");
      return;
    }
    
    setIsNotifying(true);
    try {
      let receiptUrl: string | null = null;

      // رفع الإيصال إذا كان موجوداً
      if (receiptFile) {
        setIsUploading(true);
        const fileExt = receiptFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("payment-receipts")
          .upload(fileName, receiptFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("payment-receipts")
          .getPublicUrl(fileName);

        receiptUrl = urlData.publicUrl;
        setIsUploading(false);
      }

      // التحقق من وجود سجل دفع للطلب
      const { data: existingPayment } = await supabase
        .from("order_payments")
        .select("id")
        .eq("order_id", orderId)
        .eq("supplier_id", supplierId)
        .maybeSingle();

      if (existingPayment) {
        // تحديث السجل الموجود
        const { error: updateError } = await supabase
          .from("order_payments")
          .update({
            is_paid: true,
            receipt_url: receiptUrl,
          })
          .eq("id", existingPayment.id);

        if (updateError) throw updateError;
      } else {
        // إنشاء سجل جديد
        const { error: insertError } = await supabase
          .from("order_payments")
          .insert({
            order_id: orderId,
            supplier_id: supplierId,
            restaurant_id: user.id,
            is_paid: true,
            receipt_url: receiptUrl,
          });

        if (insertError) throw insertError;
      }

      const restaurantName = profile?.business_name || "مطعم";
      
      // إرسال إشعار للمورد
      const { error } = await supabase
        .from("notifications")
        .insert({
          user_id: supplierId,
          title: t("notifications.paymentReceived"),
          message: t("notifications.paymentReceivedMessage", {
            name: restaurantName,
            amount: amountToPay.toFixed(2),
          }),
          type: "payment",
          order_id: orderId,
        });

      if (error) throw error;

      // تحديث واجهة المستخدم فوراً (علامة الصح + قائمة الدفعات)
      queryClient.invalidateQueries({ queryKey: ["order-payments", orderId] });
      queryClient.invalidateQueries({ queryKey: ["order-payment", orderId, supplierId] });

      toast.success(t("cart.paymentNotified"));
      setOpen(false);
      setReceiptFile(null);
      setReceiptPreview(null);
    } catch (error) {
      console.error("Error notifying supplier:", error);
      toast.error(t("cart.paymentNotifyError"));
    } finally {
      setIsNotifying(false);
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
        >
          <CreditCard className="h-4 w-4" />
          {t("cart.paymentDetails")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {t("cart.bankDetails")} - {supplierName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {hasBankDetails ? (
            <>
              {/* Warning message - only show if order not confirmed */}
              {!isConfirmed && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800 dark:text-amber-300">
                    <p className="font-medium">{t("cart.paymentWarningTitle")}</p>
                    <p className="text-amber-700 dark:text-amber-400 mt-1">{t("cart.paymentWarningMessage")}</p>
                  </div>
                </div>
              )}

              {/* Amount Summary */}
              {hasAgent ? (
                <div className="space-y-3">
                  {/* الإجمالي الكلي */}
                  <div className="bg-muted/50 rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-0.5">{t("orders.supplierTotal", "الإجمالي")}</p>
                    <p className="text-xl font-bold text-foreground">
                      {amountToPay.toFixed(2)} <span className="text-sm">{t("common.sar")}</span>
                    </p>
                  </div>

                  {/* المستحق للمورد */}
                  <div className="border rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 bg-primary/5">
                      <Store className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">المستحق للمورد — {supplierName}</span>
                    </div>
                    <div className="p-3 text-center">
                      <p className="text-2xl font-bold text-primary">
                        {(subtotal ?? (amountToPay - deliveryFee)).toFixed(2)} <span className="text-sm">{t("common.sar")}</span>
                      </p>
                    </div>
                    {/* بيانات بنك المورد */}
                    <div className="px-3 pb-3 space-y-2">
                      {bankName && (
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-sm">
                          <Building className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">{t("cart.bankName")}</p>
                            <p className="font-medium">{bankName}</p>
                          </div>
                        </div>
                      )}
                      {bankAccountName && (
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-sm">
                          <User className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">{t("cart.bankAccountName")}</p>
                            <p className="font-medium">{bankAccountName}</p>
                          </div>
                        </div>
                      )}
                      {bankIban && (
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-sm">
                          <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">{t("cart.bankIban")}</p>
                            <p className="font-mono text-xs break-all">{bankIban}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={copyIban} className="shrink-0 h-7 w-7 p-0">
                            {isCopied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* المستحق للمندوب */}
                  <div className="border border-amber-200 dark:border-amber-800 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/30">
                      <UserRound className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span className="font-semibold text-sm text-amber-800 dark:text-amber-200">المستحق للمندوب — {deliveryAgent!.name}</span>
                    </div>
                    <div className="p-3 text-center">
                      <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                        {deliveryFee.toFixed(2)} <span className="text-sm">{t("common.sar")}</span>
                      </p>
                    </div>
                    {/* بيانات بنك المندوب */}
                    <div className="px-3 pb-3 space-y-2">
                      {deliveryAgent!.phone && (
                        <a href={`tel:${deliveryAgent!.phone}`} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-sm text-primary hover:underline">
                          <Phone className="h-4 w-4 shrink-0" />
                          <span dir="ltr">{deliveryAgent!.phone}</span>
                        </a>
                      )}
                      {deliveryAgent!.bank_name && (
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-sm">
                          <Building className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">{t("cart.bankName")}</p>
                            <p className="font-medium">{deliveryAgent!.bank_name}</p>
                          </div>
                        </div>
                      )}
                      {deliveryAgent!.bank_account_name && (
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-sm">
                          <User className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">{t("cart.bankAccountName")}</p>
                            <p className="font-medium">{deliveryAgent!.bank_account_name}</p>
                          </div>
                        </div>
                      )}
                      {deliveryAgent!.bank_iban && (
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-sm">
                          <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">{t("cart.bankIban")}</p>
                            <p className="font-mono text-xs break-all">{deliveryAgent!.bank_iban}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={copyAgentIban} className="shrink-0 h-7 w-7 p-0">
                            {isAgentIbanCopied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* العرض العادي بدون مندوب */}
                  <div className="bg-primary/10 rounded-xl p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-1">{t("cart.amountToPay")}</p>
                    <p className="text-3xl font-bold text-primary">
                      {amountToPay.toFixed(2)} <span className="text-lg">{t("common.sar")}</span>
                    </p>
                  </div>

                  {/* Bank Details */}
                  <div className="space-y-3">
                    {bankName && (
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Building className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">{t("cart.bankName")}</p>
                          <p className="font-medium">{bankName}</p>
                        </div>
                      </div>
                    )}
                    {bankAccountName && (
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <User className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">{t("cart.bankAccountName")}</p>
                          <p className="font-medium">{bankAccountName}</p>
                        </div>
                      </div>
                    )}
                    {bankIban && (
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <CreditCard className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">{t("cart.bankIban")}</p>
                          <p className="font-mono text-sm break-all">{bankIban}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={copyIban} className="shrink-0">
                          {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Upload Receipt */}
              <div className="space-y-2">
                <p className="text-sm font-medium">{t("cart.uploadReceipt")}</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                {receiptPreview ? (
                  <div className="relative">
                    <img
                      src={receiptPreview}
                      alt="Receipt preview"
                      className="w-full h-40 object-contain rounded-lg border bg-muted"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 end-2"
                      onClick={() => {
                        setReceiptFile(null);
                        setReceiptPreview(null);
                      }}
                    >
                      {t("common.delete")}
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full h-24 border-dashed gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-5 w-5" />
                    {t("cart.selectReceiptImage")}
                  </Button>
                )}
                <p className="text-xs text-muted-foreground text-center">
                  {t("cart.receiptOptional")}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setOpen(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  variant="hero"
                  className="flex-1 gap-2"
                  onClick={notifySupplier}
                  disabled={isNotifying || isUploading}
                >
                  {isNotifying || isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isUploading ? t("cart.uploadingReceipt") : t("cart.notifyingPayment")}
                    </>
                  ) : (
                    <>
                      <Banknote className="h-4 w-4" />
                      {t("cart.notifyPayment")}
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">{t("cart.noBankDetails")}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

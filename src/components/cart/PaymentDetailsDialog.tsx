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
import { CreditCard, Copy, Check, Loader2, Banknote, Building, User, Upload, AlertTriangle, UserRound, Phone, Store } from "lucide-react";
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

  // Agent payment state
  const [agentPaymentMethod, setAgentPaymentMethod] = useState<"cash" | "transfer">("cash");
  const [agentReceiptFile, setAgentReceiptFile] = useState<File | null>(null);
  const [agentReceiptPreview, setAgentReceiptPreview] = useState<string | null>(null);
  const agentFileInputRef = useRef<HTMLInputElement>(null);
  const [isAgentIbanCopied, setIsAgentIbanCopied] = useState(false);

  const bankName = (supplierProfile as any)?.bank_name;
  const bankAccountName = (supplierProfile as any)?.bank_account_name;
  const bankIban = (supplierProfile as any)?.bank_iban;

  const hasBankDetails = bankName || bankAccountName || bankIban;
  const hasAgent = deliveryAgent && deliveryFee > 0;

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isAgent = false) => {
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
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isAgent) {
          setAgentReceiptFile(file);
          setAgentReceiptPreview(reader.result as string);
        } else {
          setReceiptFile(file);
          setReceiptPreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${user!.id}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("payment-receipts")
      .upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage
      .from("payment-receipts")
      .getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const notifySupplier = async () => {
    if (!user) return;
    if (userRole !== "restaurant") {
      toast.error("هذه الميزة متاحة للمطعم فقط");
      return;
    }
    if (!orderId) {
      toast.error("يجب إنشاء الطلب أولاً قبل إرسال إشعار الدفع");
      return;
    }

    setIsNotifying(true);
    try {
      let receiptUrl: string | null = null;
      let agentReceiptUrl: string | null = null;

      setIsUploading(true);
      if (receiptFile) {
        receiptUrl = await uploadFile(receiptFile);
      }
      if (agentReceiptFile && agentPaymentMethod === "transfer") {
        agentReceiptUrl = await uploadFile(agentReceiptFile);
      }
      setIsUploading(false);

      const { data: existingPayment } = await supabase
        .from("order_payments")
        .select("id")
        .eq("order_id", orderId)
        .eq("supplier_id", supplierId)
        .maybeSingle();

      const paymentData: any = {
        is_paid: true,
        receipt_url: receiptUrl,
      };
      if (hasAgent) {
        paymentData.agent_payment_method = agentPaymentMethod;
        paymentData.agent_receipt_url = agentPaymentMethod === "transfer" ? agentReceiptUrl : null;
      }

      if (existingPayment) {
        const { error: updateError } = await supabase
          .from("order_payments")
          .update(paymentData)
          .eq("id", existingPayment.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("order_payments")
          .insert({
            order_id: orderId,
            supplier_id: supplierId,
            restaurant_id: user.id,
            ...paymentData,
          });
        if (insertError) throw insertError;
      }

      const restaurantName = profile?.business_name || "مطعم";
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

      queryClient.invalidateQueries({ queryKey: ["order-payments", orderId] });
      queryClient.invalidateQueries({ queryKey: ["order-payment", orderId, supplierId] });
      queryClient.invalidateQueries({ queryKey: ["admin-delivery-orders"] });

      toast.success(t("cart.paymentNotified"));
      setOpen(false);
      setReceiptFile(null);
      setReceiptPreview(null);
      setAgentReceiptFile(null);
      setAgentReceiptPreview(null);
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
      <DialogContent className="sm:max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4 text-primary" />
            {t("cart.bankDetails")} - {supplierName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {hasBankDetails ? (
            <>
              {/* Warning */}
              {!isConfirmed && (
                <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800 dark:text-amber-300">
                    <p className="font-medium">{t("cart.paymentWarningTitle")}</p>
                    <p className="text-amber-700 dark:text-amber-400 mt-0.5">{t("cart.paymentWarningMessage")}</p>
                  </div>
                </div>
              )}

              {hasAgent ? (
                <div className="space-y-2">
                  {/* Total */}
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <p className="text-xs text-muted-foreground">{t("orders.supplierTotal", "الإجمالي")}</p>
                    <p className="text-lg font-bold text-foreground">
                      {amountToPay.toFixed(2)} <span className="text-xs">{t("common.sar")}</span>
                    </p>
                  </div>

                  {/* Supplier section */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-primary/5">
                      <Store className="h-3.5 w-3.5 text-primary" />
                      <span className="font-semibold text-xs">{supplierName}</span>
                      <span className="text-xs font-bold text-primary ms-auto">
                        {(subtotal ?? (amountToPay - deliveryFee)).toFixed(2)} {t("common.sar")}
                      </span>
                    </div>
                    <div className="px-2 py-2 space-y-1.5">
                      {bankName && (
                        <div className="flex items-center gap-2 text-xs">
                          <Building className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-muted-foreground">{t("cart.bankName")}:</span>
                          <span className="font-medium">{bankName}</span>
                        </div>
                      )}
                      {bankAccountName && (
                        <div className="flex items-center gap-2 text-xs">
                          <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-muted-foreground">{t("cart.bankAccountName")}:</span>
                          <span className="font-medium">{bankAccountName}</span>
                        </div>
                      )}
                      {bankIban && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <CreditCard className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="font-mono text-xs break-all flex-1">{bankIban}</span>
                          <Button variant="ghost" size="sm" onClick={copyIban} className="shrink-0 h-6 w-6 p-0">
                            {isCopied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Agent section */}
                  <div className="border border-amber-200 dark:border-amber-800 rounded-lg overflow-hidden">
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-amber-50 dark:bg-amber-950/30">
                      <UserRound className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      <span className="font-semibold text-xs text-amber-800 dark:text-amber-200">{deliveryAgent!.name}</span>
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300 ms-auto">
                        {deliveryFee.toFixed(2)} {t("common.sar")}
                      </span>
                    </div>

                    <div className="px-2 py-2 space-y-2">
                      {deliveryAgent!.phone && (
                        <a href={`tel:${deliveryAgent!.phone}`} className="flex items-center gap-2 text-xs text-primary hover:underline">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span dir="ltr">{deliveryAgent!.phone}</span>
                        </a>
                      )}

                      {/* Agent payment method choice */}
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-amber-800 dark:text-amber-200">طريقة دفع المندوب:</p>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={agentPaymentMethod === "cash" ? "default" : "outline"}
                            size="sm"
                            className="flex-1 h-7 text-xs gap-1"
                            onClick={() => setAgentPaymentMethod("cash")}
                          >
                            <Banknote className="h-3 w-3" />
                            دفع عند الاستلام
                          </Button>
                          <Button
                            type="button"
                            variant={agentPaymentMethod === "transfer" ? "default" : "outline"}
                            size="sm"
                            className="flex-1 h-7 text-xs gap-1"
                            onClick={() => setAgentPaymentMethod("transfer")}
                          >
                            <CreditCard className="h-3 w-3" />
                            تحويل بنكي
                          </Button>
                        </div>
                      </div>

                      {/* Show bank details & receipt upload only for transfer */}
                      {agentPaymentMethod === "transfer" && (
                        <div className="space-y-1.5 pt-1 border-t border-amber-100 dark:border-amber-900">
                          {deliveryAgent!.bank_name && (
                            <div className="flex items-center gap-2 text-xs">
                              <Building className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="text-muted-foreground">{t("cart.bankName")}:</span>
                              <span className="font-medium">{deliveryAgent!.bank_name}</span>
                            </div>
                          )}
                          {deliveryAgent!.bank_account_name && (
                            <div className="flex items-center gap-2 text-xs">
                              <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="text-muted-foreground">{t("cart.bankAccountName")}:</span>
                              <span className="font-medium">{deliveryAgent!.bank_account_name}</span>
                            </div>
                          )}
                          {deliveryAgent!.bank_iban && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <CreditCard className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="font-mono text-xs break-all flex-1">{deliveryAgent!.bank_iban}</span>
                              <Button variant="ghost" size="sm" onClick={copyAgentIban} className="shrink-0 h-6 w-6 p-0">
                                {isAgentIbanCopied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                              </Button>
                            </div>
                          )}

                          {/* Agent receipt upload */}
                          <input
                            ref={agentFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, true)}
                            className="hidden"
                          />
                          {agentReceiptPreview ? (
                            <div className="relative">
                              <img
                                src={agentReceiptPreview}
                                alt="Agent receipt"
                                className="w-full h-24 object-contain rounded border bg-muted"
                              />
                              <Button
                                variant="secondary"
                                size="sm"
                                className="absolute top-1 end-1 h-6 text-xs"
                                onClick={() => {
                                  setAgentReceiptFile(null);
                                  setAgentReceiptPreview(null);
                                }}
                              >
                                {t("common.delete")}
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              className="w-full h-14 border-dashed gap-1.5 text-xs"
                              onClick={() => agentFileInputRef.current?.click()}
                            >
                              <Upload className="h-4 w-4" />
                              إرفاق إيصال تحويل المندوب
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Normal view without agent */}
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-0.5">{t("cart.amountToPay")}</p>
                    <p className="text-2xl font-bold text-primary">
                      {amountToPay.toFixed(2)} <span className="text-sm">{t("common.sar")}</span>
                    </p>
                  </div>

                  <div className="space-y-2">
                    {bankName && (
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-sm">
                        <Building className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">{t("cart.bankName")}</p>
                          <p className="font-medium text-sm">{bankName}</p>
                        </div>
                      </div>
                    )}
                    {bankAccountName && (
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-sm">
                        <User className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">{t("cart.bankAccountName")}</p>
                          <p className="font-medium text-sm">{bankAccountName}</p>
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
                </>
              )}

              {/* Upload Supplier Receipt */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium">{t("cart.uploadReceipt")}</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, false)}
                  className="hidden"
                />

                {receiptPreview ? (
                  <div className="relative">
                    <img
                      src={receiptPreview}
                      alt="Receipt preview"
                      className="w-full h-28 object-contain rounded border bg-muted"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-1 end-1 h-6 text-xs"
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
                    className="w-full h-16 border-dashed gap-1.5 text-xs"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    {t("cart.selectReceiptImage")}
                  </Button>
                )}
                <p className="text-xs text-muted-foreground text-center">
                  {t("cart.receiptOptional")}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setOpen(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  variant="hero"
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={notifySupplier}
                  disabled={isNotifying || isUploading}
                >
                  {isNotifying || isUploading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {isUploading ? t("cart.uploadingReceipt") : t("cart.notifyingPayment")}
                    </>
                  ) : (
                    <>
                      <Banknote className="h-3.5 w-3.5" />
                      {t("cart.notifyPayment")}
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <CreditCard className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">{t("cart.noBankDetails")}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

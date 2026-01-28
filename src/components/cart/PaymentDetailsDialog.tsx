import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Copy, Check, Loader2, Banknote, Building, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SupplierBankDetails {
  bank_name?: string | null;
  bank_account_name?: string | null;
  bank_iban?: string | null;
}

interface PaymentDetailsDialogProps {
  supplierId: string;
  supplierName: string;
  supplierProfile: SupplierBankDetails | null;
  amountToPay: number;
}

export const PaymentDetailsDialog = ({
  supplierId,
  supplierName,
  supplierProfile,
  amountToPay,
}: PaymentDetailsDialogProps) => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [isCopied, setIsCopied] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [open, setOpen] = useState(false);

  const bankName = (supplierProfile as any)?.bank_name;
  const bankAccountName = (supplierProfile as any)?.bank_account_name;
  const bankIban = (supplierProfile as any)?.bank_iban;

  const hasBankDetails = bankName || bankAccountName || bankIban;

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

  const notifySupplier = async () => {
    setIsNotifying(true);
    try {
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
        });

      if (error) throw error;

      toast.success(t("cart.paymentNotified"));
      setOpen(false);
    } catch (error) {
      console.error("Error notifying supplier:", error);
      toast.error(t("cart.paymentNotifyError"));
    } finally {
      setIsNotifying(false);
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
              {/* Amount to Pay */}
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyIban}
                      className="shrink-0"
                    >
                      {isCopied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}
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
                  disabled={isNotifying}
                >
                  {isNotifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("cart.notifyingPayment")}
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
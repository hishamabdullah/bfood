import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CreditCard, Check } from "lucide-react";
import { PaymentDetailsDialog } from "@/components/cart/PaymentDetailsDialog";
import { usePaymentStatus } from "@/hooks/useRestaurantPayments";

interface SupplierProfile {
  user_id?: string;
  business_name?: string;
  bank_name?: string | null;
  bank_account_name?: string | null;
  bank_iban?: string | null;
}

interface OrderPaymentButtonProps {
  supplierId: string;
  supplierName: string;
  supplierProfile: SupplierProfile | null;
  amountToPay: number;
  orderId: string;
}

export const OrderPaymentButton = ({
  supplierId,
  supplierName,
  supplierProfile,
  amountToPay,
  orderId,
}: OrderPaymentButtonProps) => {
  const { t } = useTranslation();
  const { data: paymentStatus } = usePaymentStatus(supplierId);

  const isPaid = paymentStatus?.is_paid === true;

  return (
    <div className="flex items-center gap-2">
      <PaymentDetailsDialog
        supplierId={supplierId}
        supplierName={supplierName}
        supplierProfile={supplierProfile}
        amountToPay={amountToPay}
        orderId={orderId}
      />
      {isPaid && (
        <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
          <Check className="h-4 w-4" />
          <span>{t("orders.paymentNotified")}</span>
        </div>
      )}
    </div>
  );
};

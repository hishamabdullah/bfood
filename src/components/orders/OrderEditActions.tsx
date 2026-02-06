import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, Edit2, Minus, Plus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOrderManagement } from "@/hooks/useOrderManagement";

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  status?: string;
  product?: {
    name: string;
    image_url?: string;
  } | null;
}

interface EditItemDialogProps {
  item: OrderItem;
  orderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditItemDialog = ({ item, orderId, open, onOpenChange }: EditItemDialogProps) => {
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(item.quantity);
  const { updateOrderItem, deleteOrderItem } = useOrderManagement();

  const handleSave = () => {
    if (quantity > 0 && quantity !== item.quantity) {
      updateOrderItem.mutate({ itemId: item.id, quantity, orderId });
    }
    onOpenChange(false);
  };

  const handleDelete = () => {
    deleteOrderItem.mutate({ itemId: item.id, orderId });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5" />
            {t("orders.editItem", "تعديل المنتج")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3">
            {item.product?.image_url ? (
              <img
                src={item.product.image_url}
                alt={item.product?.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-muted" />
            )}
            <div>
              <p className="font-medium">{item.product?.name || t("orders.deletedProduct")}</p>
              <p className="text-sm text-muted-foreground">
                {item.unit_price} {t("common.sar")}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("orders.quantity", "الكمية")}</label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t">
            <span className="font-medium">{t("orders.total", "الإجمالي")}:</span>
            <span className="font-bold text-primary">
              {(quantity * item.unit_price).toFixed(2)} {t("common.sar")}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleteOrderItem.isPending}
            className="gap-1"
          >
            {deleteOrderItem.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {t("orders.deleteItem", "حذف")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            {t("common.cancel", "إلغاء")}
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={updateOrderItem.isPending || quantity === item.quantity}
            className="flex-1"
          >
            {updateOrderItem.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t("common.save", "حفظ")
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface CancelSupplierDialogProps {
  orderId: string;
  supplierId: string;
  supplierName: string;
  trigger?: React.ReactNode;
}

export const CancelSupplierDialog = ({
  orderId,
  supplierId,
  supplierName,
  trigger,
}: CancelSupplierDialogProps) => {
  const { t } = useTranslation();
  const { deleteSupplierItems } = useOrderManagement();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="text-destructive gap-1 h-7">
            <X className="h-3 w-3" />
            {t("orders.cancelSupplier", "إلغاء طلب المورد")}
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("orders.cancelSupplierOrder", "إلغاء طلب المورد")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              "orders.cancelSupplierConfirm",
              "هل أنت متأكد من إلغاء جميع المنتجات من {{supplier}}؟ لا يمكن التراجع عن هذا الإجراء.",
              { supplier: supplierName }
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel", "إلغاء")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteSupplierItems.mutate({ orderId, supplierId })}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteSupplierItems.isPending}
          >
            {deleteSupplierItems.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin me-2" />
            ) : null}
            {t("orders.confirmCancel", "تأكيد الإلغاء")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

interface CancelOrderDialogProps {
  orderId: string;
  trigger?: React.ReactNode;
}

export const CancelOrderDialog = ({ orderId, trigger }: CancelOrderDialogProps) => {
  const { t } = useTranslation();
  const { deleteOrder } = useOrderManagement();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button variant="destructive" size="sm" className="gap-1">
            <Trash2 className="h-4 w-4" />
            {t("orders.cancelOrder", "إلغاء الطلب بالكامل")}
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("orders.cancelEntireOrder", "إلغاء الطلب بالكامل")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              "orders.cancelOrderConfirm",
              "هل أنت متأكد من إلغاء هذا الطلب بالكامل؟ سيتم حذف جميع المنتجات من جميع الموردين. لا يمكن التراجع عن هذا الإجراء."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel", "إلغاء")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteOrder.mutate({ orderId })}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteOrder.isPending}
          >
            {deleteOrder.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin me-2" />
            ) : null}
            {t("orders.confirmCancelAll", "إلغاء الطلب بالكامل")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

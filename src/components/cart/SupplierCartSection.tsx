import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Minus, Plus, Trash2, Package, Truck, Warehouse, MapPin, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useProductTranslation } from "@/hooks/useProductTranslation";
import type { SupplierGroup } from "@/contexts/CartContext";
import { PaymentDetailsDialog } from "./PaymentDetailsDialog";

interface SupplierCartSectionProps {
  supplierId: string;
  group: SupplierGroup;
  isPickup: boolean;
  onPickupChange: (isPickup: boolean) => void;
  deliveryFeeInfo: { fee: number; reason: string; isFree: boolean };
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
}

export const SupplierCartSection = ({
  supplierId,
  group,
  isPickup,
  onPickupChange,
  deliveryFeeInfo,
  updateQuantity,
  removeItem,
}: SupplierCartSectionProps) => {
  const { t } = useTranslation();
  const { getProductName } = useProductTranslation();

  const supplierSubtotal = group.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const warehouseUrl = group.supplierProfile?.google_maps_url;

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Supplier Header */}
      <div className="bg-muted/50 px-6 py-3 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold">{group.supplierName}</h3>
        <PaymentDetailsDialog
          supplierId={supplierId}
          supplierName={group.supplierName}
          supplierProfile={group.supplierProfile}
          amountToPay={supplierSubtotal + (isPickup ? 0 : deliveryFeeInfo?.fee || 0)}
        />
      </div>

      {/* Items */}
      <div className="divide-y divide-border">
        {group.items.map((item) => (
          <div key={item.id} className="p-4 flex gap-4">
            {/* Image */}
            <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden">
              {item.product.image_url ? (
                <img
                  src={item.product.image_url}
                  alt={getProductName(item.product)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="h-8 w-8 text-muted-foreground" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <Link to={`/products/${item.product.id}`}>
                <h4 className="font-semibold mb-1 hover:text-primary transition-colors">
                  {getProductName(item.product)}
                </h4>
              </Link>
              <p className="text-sm text-muted-foreground mb-2">
                {item.product.price} {t("common.sar")} / {item.product.unit}
              </p>

              {/* Quantity Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Price & Remove */}
            <div className="text-left">
              <p className="font-bold text-lg text-primary">
                {(item.product.price * item.quantity).toFixed(2)} {t("common.sar")}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive mt-2"
                onClick={() => removeItem(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Delivery Method Selection for this supplier */}
      <div className="px-6 py-4 border-t border-border bg-muted/20">
        <label className="block text-sm font-medium mb-3">{t("cart.deliveryMethod")}</label>
        <RadioGroup
          value={isPickup ? "pickup" : "delivery"}
          onValueChange={(value) => onPickupChange(value === "pickup")}
          className="space-y-2"
        >
          <div className="flex items-center space-x-2 rtl:space-x-reverse p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
            <RadioGroupItem value="delivery" id={`delivery-${supplierId}`} />
            <Label htmlFor={`delivery-${supplierId}`} className="flex items-center gap-2 cursor-pointer flex-1">
              <Truck className="h-4 w-4 text-primary" />
              {t("cart.deliveryToAddress")}
            </Label>
          </div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
            <RadioGroupItem value="pickup" id={`pickup-${supplierId}`} />
            <Label htmlFor={`pickup-${supplierId}`} className="flex flex-col cursor-pointer flex-1">
              <span className="flex items-center gap-2">
                <Warehouse className="h-4 w-4 text-primary" />
                {t("cart.pickupFromWarehouse")}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                {t("cart.pickupFromWarehouseDesc")}
              </span>
            </Label>
          </div>
        </RadioGroup>

        {/* Show warehouse location if pickup is selected and URL exists */}
        {isPickup && warehouseUrl && (
          <a
            href={warehouseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <MapPin className="h-4 w-4" />
            <span className="flex-1 text-sm font-medium">{t("cart.warehouseLocation")}</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        )}

        {isPickup && !warehouseUrl && (
          <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{t("cart.noWarehouseLocation")}</span>
          </div>
        )}
      </div>

      {/* Supplier Footer with Delivery Fee */}
      <div className="bg-muted/30 px-6 py-3 border-t border-border space-y-2">
        {isPickup ? (
          <div className="flex justify-between text-sm text-green-600">
            <span className="flex items-center gap-1">
              <Warehouse className="h-4 w-4" />
              {t("cart.pickupFromWarehouse")}
            </span>
            <span className="font-medium">{t("cart.freeDelivery")}</span>
          </div>
        ) : (
          <div
            className={`flex justify-between text-sm ${
              deliveryFeeInfo?.fee > 0 ? "text-amber-600" : deliveryFeeInfo?.isFree ? "text-green-600" : ""
            }`}
          >
            <span className="flex items-center gap-1">
              <Truck className="h-4 w-4" />
              {t("cart.deliveryFee")}
              {deliveryFeeInfo?.reason && (
                <span
                  className={`text-xs ${
                    deliveryFeeInfo.isFree ? "bg-green-100 text-green-700 px-2 py-0.5 rounded-full" : ""
                  }`}
                >
                  ({deliveryFeeInfo.reason})
                </span>
              )}
            </span>
            <span>
              {(deliveryFeeInfo?.fee || 0).toFixed(2)} {t("common.sar")}
            </span>
          </div>
        )}
        <div className="flex justify-between font-semibold pt-2 border-t border-border">
          <span>
            {t("cart.supplierTotal", { name: group.supplierName })}
          </span>
          <span className="text-primary">
            {(supplierSubtotal + (isPickup ? 0 : deliveryFeeInfo?.fee || 0)).toFixed(2)} {t("common.sar")}
          </span>
        </div>
      </div>
    </div>
  );
};

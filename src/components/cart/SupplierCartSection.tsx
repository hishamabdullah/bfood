import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Minus, Plus, Trash2, Package, Truck, Warehouse, MapPin, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useProductTranslation } from "@/hooks/useProductTranslation";
import type { SupplierGroup } from "@/contexts/CartContext";

interface SupplierCartSectionProps {
  supplierId: string;
  group: SupplierGroup;
  isPickup: boolean;
  onPickupChange: (isPickup: boolean) => void;
  deliveryFeeInfo: { fee: number; reason: string; isFree: boolean; productFees?: number; supplierFee?: number };
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  supplierSubtotal: number;
}

export const SupplierCartSection = ({
  supplierId,
  group,
  isPickup,
  onPickupChange,
  deliveryFeeInfo,
  updateQuantity,
  removeItem,
  supplierSubtotal,
}: SupplierCartSectionProps) => {
  const { t } = useTranslation();
  const { getProductName } = useProductTranslation();

  const warehouseUrl = group.supplierProfile?.google_maps_url;
  const deliveryOption = (group.supplierProfile as any)?.delivery_option || "with_fee";
  const minimumOrderAmount = group.supplierProfile?.minimum_order_amount || 0;
  
  // حساب إذا كان المطعم مؤهلاً للتوصيل
  const meetsMinimum = supplierSubtotal >= minimumOrderAmount;
  
  // تحديد إذا كان التوصيل متاحاً
  const isDeliveryAvailable = deliveryOption !== "no_delivery";
  const canSelectDelivery = deliveryOption === "with_fee" || (deliveryOption === "minimum_only" && meetsMinimum);

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Supplier Header */}
      <div className="bg-muted/50 px-6 py-3 border-b border-border">
        <h3 className="font-semibold">{group.supplierName}</h3>
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
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    if (!isNaN(value) && value >= 1) {
                      updateQuantity(item.id, value);
                    }
                  }}
                  className="w-16 h-8 text-center font-bold text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
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
      {isDeliveryAvailable ? (
        <div className="px-6 py-4 border-t border-border bg-muted/20">
          <label className="block text-sm font-medium mb-3">{t("cart.deliveryMethod")}</label>
          <RadioGroup
            value={isPickup ? "pickup" : "delivery"}
            onValueChange={(value) => {
              if (value === "delivery" && !canSelectDelivery) {
                return; // منع التغيير إذا لم يتجاوز الحد الأدنى
              }
              onPickupChange(value === "pickup");
            }}
            className="space-y-2"
          >
            {/* Delivery Option */}
            <div className="relative">
              <Label
                htmlFor={`delivery-${supplierId}`}
                className={`flex items-start gap-3 p-3 rounded-lg border border-border transition-colors ${
                  canSelectDelivery 
                    ? "hover:bg-muted/50 cursor-pointer" 
                    : "opacity-60 cursor-not-allowed bg-muted/30"
                }`}
              >
                <RadioGroupItem 
                  value="delivery" 
                  id={`delivery-${supplierId}`} 
                  className="shrink-0 mt-0.5" 
                  disabled={!canSelectDelivery}
                />
                <Truck className={`h-4 w-4 shrink-0 mt-0.5 ${canSelectDelivery ? "text-primary" : "text-muted-foreground"}`} />
                <div className="flex-1">
                  <span className="block">{t("cart.deliveryToAddress")}</span>
                  {deliveryOption === "minimum_only" && !meetsMinimum && (
                    <span className="text-xs text-amber-600 mt-1 block">
                      {t("cart.minimumForDelivery", { amount: minimumOrderAmount })}
                    </span>
                  )}
                  {deliveryOption === "minimum_only" && meetsMinimum && (
                    <span className="text-xs text-green-600 mt-1 block">
                      {t("cart.minimumReached")}
                    </span>
                  )}
                </div>
              </Label>
            </div>

            {/* Pickup Option */}
            <Label
              htmlFor={`pickup-${supplierId}`}
              className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <RadioGroupItem value="pickup" id={`pickup-${supplierId}`} className="shrink-0 mt-0.5" />
              <Warehouse className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="block">{t("cart.pickupFromWarehouse")}</span>
                <span className="text-xs text-muted-foreground mt-1 block">
                  {t("cart.pickupFromWarehouseDesc")}
                </span>
              </div>
            </Label>
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
      ) : (
        /* No delivery available - pickup only */
        <div className="px-6 py-4 border-t border-border bg-amber-50 dark:bg-amber-900/20">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-3">
            <Warehouse className="h-5 w-5" />
            <span className="font-medium">{t("cart.pickupOnly")}</span>
          </div>
          <p className="text-sm text-amber-600 dark:text-amber-500 mb-3">
            {t("cart.pickupOnlyDesc")}
          </p>
          
          {/* Show warehouse location */}
          {warehouseUrl && (
            <a
              href={warehouseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            >
              <MapPin className="h-4 w-4" />
              <span className="flex-1 text-sm font-medium">{t("cart.warehouseLocation")}</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          )}

          {!warehouseUrl && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{t("cart.noWarehouseLocation")}</span>
            </div>
          )}
        </div>
      )}

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
          <div className="space-y-1">
            {/* Product delivery fees (always shown if > 0) */}
            {(deliveryFeeInfo?.productFees ?? 0) > 0 && (
              <div className="flex justify-between text-sm text-amber-600">
                <span className="flex items-center gap-1">
                  <Truck className="h-4 w-4" />
                  {t("cart.productDeliveryFees")}
                </span>
                <span>
                  {(deliveryFeeInfo?.productFees || 0).toFixed(2)} {t("common.sar")}
                </span>
              </div>
            )}
            {/* Supplier delivery fee */}
            {(deliveryFeeInfo?.supplierFee ?? 0) > 0 && (
              <div className="flex justify-between text-sm text-amber-600">
                <span className="flex items-center gap-1">
                  <Truck className="h-4 w-4" />
                  {t("cart.supplierDeliveryFee")}
                  <span className="text-xs">
                    ({deliveryFeeInfo?.reason})
                  </span>
                </span>
                <span>
                  {(deliveryFeeInfo?.supplierFee || 0).toFixed(2)} {t("common.sar")}
                </span>
              </div>
            )}
            {/* Show free supplier fee if applicable */}
            {deliveryFeeInfo?.isFree && (deliveryFeeInfo?.supplierFee ?? 0) === 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span className="flex items-center gap-1">
                  <Truck className="h-4 w-4" />
                  {t("cart.supplierDeliveryFee")}
                </span>
                <span className="font-medium">{t("cart.freeDelivery")}</span>
              </div>
            )}
            {/* Total delivery if both exist */}
            {(deliveryFeeInfo?.productFees ?? 0) > 0 && ((deliveryFeeInfo?.supplierFee ?? 0) > 0 || deliveryFeeInfo?.isFree) && (
              <div className="flex justify-between text-sm font-medium border-t border-border/50 pt-1">
                <span>{t("cart.totalDeliveryFee")}</span>
                <span className="text-amber-600">
                  {(deliveryFeeInfo?.fee || 0).toFixed(2)} {t("common.sar")}
                </span>
              </div>
            )}
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

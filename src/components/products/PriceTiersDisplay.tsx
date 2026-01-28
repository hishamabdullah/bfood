import { useProductPriceTiers, PriceTier } from "@/hooks/useProductPriceTiers";
import { useTranslation } from "react-i18next";
import { Layers, Check } from "lucide-react";

interface PriceTiersDisplayProps {
  productId: string;
  basePrice: number;
  unit: string;
  currentQuantity?: number;
}

export default function PriceTiersDisplay({
  productId,
  basePrice,
  unit,
  currentQuantity = 1,
}: PriceTiersDisplayProps) {
  const { t } = useTranslation();
  const { data: tiers, isLoading } = useProductPriceTiers(productId);

  if (isLoading || !tiers || tiers.length === 0) {
    return null;
  }

  const getApplicableTier = (quantity: number): PriceTier | null => {
    const sortedTiers = [...tiers].sort((a, b) => b.min_quantity - a.min_quantity);
    for (const tier of sortedTiers) {
      if (quantity >= tier.min_quantity) {
        return tier;
      }
    }
    return null;
  };

  const applicableTier = getApplicableTier(currentQuantity);

  const calculateSavings = (tierPrice: number) => {
    if (basePrice <= 0) return 0;
    return Math.round(((basePrice - tierPrice) / basePrice) * 100);
  };

  return (
    <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-primary">
        <Layers className="h-5 w-5" />
        <h4 className="font-semibold">خصومات الكميات</h4>
      </div>
      
      <div className="space-y-2">
        {/* Base price row */}
        <div className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
          !applicableTier ? "bg-primary/10 border border-primary/30" : "bg-background/50"
        }`}>
          <span className="text-sm">
            1 - {tiers[0].min_quantity - 1} {unit}
          </span>
          <div className="flex items-center gap-2">
            <span className="font-medium">{basePrice} {t("common.sar")}/{unit}</span>
            {!applicableTier && <Check className="h-4 w-4 text-primary" />}
          </div>
        </div>

        {/* Tier rows */}
        {tiers.map((tier, index) => {
          const nextTier = tiers[index + 1];
          const isActive = applicableTier?.id === tier.id;
          const savings = calculateSavings(tier.price_per_unit);
          
          return (
            <div
              key={tier.id}
              className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                isActive ? "bg-primary/10 border border-primary/30" : "bg-background/50"
              }`}
            >
              <span className="text-sm">
                {nextTier ? (
                  `${tier.min_quantity} - ${nextTier.min_quantity - 1} ${unit}`
                ) : (
                  `${tier.min_quantity}+ ${unit}`
                )}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {tier.price_per_unit} {t("common.sar")}/{unit}
                </span>
                {savings > 0 && (
                  <span className="text-xs bg-green-500/20 text-green-600 px-1.5 py-0.5 rounded">
                    -{savings}%
                  </span>
                )}
                {isActive && <Check className="h-4 w-4 text-primary" />}
              </div>
            </div>
          );
        })}
      </div>

      {applicableTier && (
        <div className="text-sm text-green-600 font-medium flex items-center gap-1 pt-1">
          <Check className="h-4 w-4" />
          أنت تحصل على سعر {applicableTier.price_per_unit} {t("common.sar")} للوحدة!
        </div>
      )}
    </div>
  );
}

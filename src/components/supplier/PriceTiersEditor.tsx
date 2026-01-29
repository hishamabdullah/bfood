import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Tag } from "lucide-react";

export interface PriceTier {
  id?: string;
  min_quantity: number;
  price_per_unit: number;
}

interface PriceTiersEditorProps {
  tiers: PriceTier[];
  onChange: (tiers: PriceTier[]) => void;
  basePrice: number;
  unit: string;
}

export default function PriceTiersEditor({
  tiers,
  onChange,
  basePrice,
  unit,
}: PriceTiersEditorProps) {
  const { t } = useTranslation();

  const addTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const newMinQuantity = lastTier ? lastTier.min_quantity + 10 : 10;
    const newPrice = lastTier ? lastTier.price_per_unit * 0.95 : basePrice * 0.95;
    
    onChange([
      ...tiers,
      {
        min_quantity: newMinQuantity,
        price_per_unit: Math.round(newPrice * 100) / 100,
      },
    ]);
  };

  const removeTier = (index: number) => {
    const newTiers = tiers.filter((_, i) => i !== index);
    onChange(newTiers);
  };

  const updateTier = (index: number, field: keyof PriceTier, value: number) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    onChange(newTiers);
  };

  const calculateDiscount = (tierPrice: number): number => {
    if (basePrice <= 0) return 0;
    return Math.round(((basePrice - tierPrice) / basePrice) * 100);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-primary" />
          <Label className="text-base font-medium">{t("productForm.priceTiers")}</Label>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addTier}
          disabled={tiers.length >= 10}
        >
          <Plus className="h-4 w-4 ml-1" />
          {t("productForm.addTier")}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {t("productForm.priceTiersDescription")}
      </p>

      {tiers.length === 0 ? (
        <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed">
          <Tag className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            {t("productForm.noTiers")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tiers.map((tier, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border"
            >
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {t("productForm.minQuantity")}
                  </Label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min="1"
                      value={tier.min_quantity}
                      onChange={(e) =>
                        updateTier(index, "min_quantity", parseInt(e.target.value) || 0)
                      }
                      className="h-9"
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {t(`productForm.units.${unit}`, unit)}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {t("productForm.pricePerUnit")}
                  </Label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={tier.price_per_unit}
                      onChange={(e) =>
                        updateTier(index, "price_per_unit", parseFloat(e.target.value) || 0)
                      }
                      className="h-9"
                    />
                    <span className="text-sm text-muted-foreground">{t("common.sar")}</span>
                  </div>
                </div>
              </div>
              
              {/* Discount Badge */}
              {basePrice > 0 && tier.price_per_unit < basePrice && (
                <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded text-xs font-medium">
                  {t("productForm.discount")} {calculateDiscount(tier.price_per_unit)}%
                </div>
              )}
              
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                onClick={() => removeTier(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {tiers.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {t("productForm.tiersNote")}
        </p>
      )}
    </div>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Layers } from "lucide-react";
import { PriceTierInput } from "@/hooks/useProductPriceTiers";

interface PriceTiersEditorProps {
  tiers: PriceTierInput[];
  onChange: (tiers: PriceTierInput[]) => void;
  basePrice: number;
  unit: string;
  maxTiers?: number;
}

export default function PriceTiersEditor({
  tiers,
  onChange,
  basePrice,
  unit,
  maxTiers = 10,
}: PriceTiersEditorProps) {
  const [error, setError] = useState<string | null>(null);

  const addTier = () => {
    if (tiers.length >= maxTiers) {
      setError(`الحد الأقصى ${maxTiers} شرائح`);
      return;
    }

    // Suggest next tier values
    const lastTier = tiers[tiers.length - 1];
    const suggestedQuantity = lastTier ? lastTier.min_quantity + 5 : 5;
    const suggestedPrice = lastTier
      ? Math.max(0.01, lastTier.price_per_unit * 0.95)
      : Math.max(0.01, basePrice * 0.95);

    onChange([
      ...tiers,
      {
        min_quantity: suggestedQuantity,
        price_per_unit: Math.round(suggestedPrice * 100) / 100,
      },
    ]);
    setError(null);
  };

  const removeTier = (index: number) => {
    const newTiers = tiers.filter((_, i) => i !== index);
    onChange(newTiers);
    setError(null);
  };

  const updateTier = (
    index: number,
    field: keyof PriceTierInput,
    value: number
  ) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    
    // Sort by min_quantity
    newTiers.sort((a, b) => a.min_quantity - b.min_quantity);
    
    onChange(newTiers);
    setError(null);
  };

  const calculateSavings = (tierPrice: number) => {
    if (basePrice <= 0) return 0;
    return Math.round(((basePrice - tierPrice) / basePrice) * 100);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <Label className="text-base font-medium">شرائح الأسعار</Label>
        </div>
        <span className="text-xs text-muted-foreground">
          {tiers.length}/{maxTiers} شرائح
        </span>
      </div>

      {basePrice > 0 && (
        <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          السعر الأساسي: <span className="font-medium text-foreground">{basePrice}</span> ر.س/{unit}
        </div>
      )}

      {tiers.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed rounded-lg">
          <Layers className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-3">
            أضف شرائح أسعار لتقديم خصومات على الكميات الكبيرة
          </p>
          <Button type="button" variant="outline" size="sm" onClick={addTier}>
            <Plus className="h-4 w-4" />
            إضافة شريحة
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tiers.map((tier, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 border rounded-lg bg-card"
            >
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    من كمية ({unit})
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={tier.min_quantity}
                    onChange={(e) =>
                      updateTier(index, "min_quantity", parseInt(e.target.value) || 1)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    السعر للوحدة (ر.س)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={tier.price_per_unit}
                    onChange={(e) =>
                      updateTier(
                        index,
                        "price_per_unit",
                        parseFloat(e.target.value) || 0.01
                      )
                    }
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-1">
                {tier.price_per_unit < basePrice && (
                  <span className="text-xs text-green-600 font-medium">
                    -{calculateSavings(tier.price_per_unit)}%
                  </span>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => removeTier(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {tiers.length < maxTiers && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTier}
              className="w-full"
            >
              <Plus className="h-4 w-4" />
              إضافة شريحة أخرى
            </Button>
          )}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {tiers.length > 0 && (
        <div className="text-xs text-muted-foreground bg-primary/5 rounded-lg p-3">
          <strong>مثال:</strong> إذا كان السعر الأساسي 100 ر.س وأضفت شريحة "من 10 {unit} بسعر 90 ر.س"،
          فعند طلب 10 {unit} أو أكثر سيكون السعر 90 ر.س للوحدة.
        </div>
      )}
    </div>
  );
}

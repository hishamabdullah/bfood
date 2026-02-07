import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Crown } from "lucide-react";
import { useSubscriptionPlans, useAssignPlanToRestaurant } from "@/hooks/useSubscriptionPlans";

interface AssignPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantId: string;
  restaurantName: string;
}

const AssignPlanDialog = ({
  open,
  onOpenChange,
  restaurantId,
  restaurantName,
}: AssignPlanDialogProps) => {
  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans(true);
  const assignPlan = useAssignPlanToRestaurant();

  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [customDuration, setCustomDuration] = useState<number | null>(null);

  const selectedPlan = plans?.find((p) => p.id === selectedPlanId);

  const handleAssign = async () => {
    if (!selectedPlanId || !selectedPlan) return;

    const duration = customDuration || selectedPlan.duration_months;

    await assignPlan.mutateAsync({
      restaurantId,
      planId: selectedPlanId,
      durationMonths: duration,
    });

    onOpenChange(false);
    setSelectedPlanId("");
    setCustomDuration(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            تعيين خطة اشتراك
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">المطعم:</p>
            <p className="font-medium">{restaurantName}</p>
          </div>

          {plansLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : plans && plans.length > 0 ? (
            <>
              <div className="space-y-2">
                <Label>اختر الخطة</Label>
                <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر خطة الاشتراك" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        <div className="flex items-center justify-between gap-4">
                          <span>{plan.name}</span>
                          <span className="text-muted-foreground text-sm">
                            {plan.price} ر.س / {plan.duration_months} شهر
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPlan && (
                <>
                  <div className="p-3 bg-primary/5 rounded-lg space-y-2">
                    <p className="font-medium">{selectedPlan.name}</p>
                    {selectedPlan.description && (
                      <p className="text-sm text-muted-foreground">
                        {selectedPlan.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      <span>السعر: {selectedPlan.price} ر.س</span>
                      <span>المدة الافتراضية: {selectedPlan.duration_months} شهر</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>المدة (بالأشهر)</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder={`الافتراضي: ${selectedPlan.duration_months} شهر`}
                      value={customDuration || ""}
                      onChange={(e) =>
                        setCustomDuration(e.target.value ? Number(e.target.value) : null)
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      اترك فارغاً لاستخدام المدة الافتراضية للخطة
                    </p>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              لا توجد خطط اشتراك نشطة. قم بإنشاء خطة أولاً.
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedPlanId || assignPlan.isPending}
            >
              {assignPlan.isPending && (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              )}
              تعيين الخطة
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignPlanDialog;

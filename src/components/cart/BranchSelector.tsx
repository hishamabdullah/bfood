import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useBranches } from "@/hooks/useBranches";
import { BranchFormDialog } from "@/components/branches/BranchFormDialog";
import { Building2, Plus, MapPin, Edit } from "lucide-react";
import { useTranslation } from "react-i18next";

interface BranchSelectorProps {
  selectedBranchId: string;
  onBranchChange: (branchId: string, address: string) => void;
  customAddress: string;
  onCustomAddressChange: (address: string) => void;
}

export const BranchSelector = ({
  selectedBranchId,
  onBranchChange,
  customAddress,
  onCustomAddressChange,
}: BranchSelectorProps) => {
  const { t } = useTranslation();
  const { data: branches = [], isLoading } = useBranches();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Set initial mode based on branches availability
  useEffect(() => {
    if (!isLoading) {
      if (branches.length === 0) {
        setIsCustomMode(true);
      } else if (!selectedBranchId && !isCustomMode) {
        // If branches exist but none selected, don't auto-switch to custom
        setIsCustomMode(false);
      }
    }
  }, [branches, isLoading, selectedBranchId, isCustomMode]);

  // Handle branch selection from dropdown
  const handleBranchSelect = (value: string) => {
    if (value === "custom") {
      setIsCustomMode(true);
      onBranchChange("", "");
    } else {
      setIsCustomMode(false);
      const branch = branches.find((b) => b.id === value);
      if (branch) {
        onBranchChange(branch.id, branch.google_maps_url || branch.address || "");
      }
    }
  };

  // Handle adding new branch - separate from select
  const handleAddNewBranch = () => {
    setIsAddDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 w-20 bg-muted rounded mb-2" />
        <div className="h-10 bg-muted rounded" />
      </div>
    );
  }

  // If no branches exist, show only manual entry mode
  const hasBranches = branches.length > 0;

  return (
    <div className="space-y-4">
      <div>
        <Label className="flex items-center gap-2 mb-2">
          <Building2 className="h-4 w-4" />
          {t("cart.deliveryBranch") || "فرع التوصيل"}
        </Label>

        {hasBranches ? (
          // Show dropdown + add button when branches exist
          <div className="flex gap-2">
            <Select 
              value={isCustomMode ? "custom" : selectedBranchId} 
              onValueChange={handleBranchSelect}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={t("cart.selectBranch") || "اختر فرع التوصيل"} />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    <div className="flex items-center gap-2">
                      <span>{branch.name}</span>
                      {branch.is_default && (
                        <span className="text-xs text-muted-foreground">({t("common.default") || "افتراضي"})</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
                <SelectItem value="custom">
                  <div className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    <span>{t("cart.enterManually") || "إدخال عنوان يدوياً"}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAddNewBranch}
              title={t("cart.addNewBranch") || "إضافة فرع جديد"}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          // Show only add button when no branches exist
          <div className="flex gap-2">
            <div className="flex-1 h-10 px-3 py-2 rounded-md border border-input bg-muted/50 text-sm text-muted-foreground flex items-center">
              {t("cart.noBranches") || "لا توجد فروع محفوظة"}
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAddNewBranch}
              title={t("cart.addNewBranch") || "إضافة فرع جديد"}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Show selected branch info */}
      {!isCustomMode && selectedBranchId && hasBranches && (
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          {(() => {
            const branch = branches.find((b) => b.id === selectedBranchId);
            if (!branch) return null;
            return (
              <div className="space-y-1">
                {branch.address && (
                  <p className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {branch.address}
                  </p>
                )}
                {branch.google_maps_url && (
                  <a
                    href={branch.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-xs"
                  >
                    {t("cart.viewOnMap") || "عرض على الخريطة"}
                  </a>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Custom address input - show when in custom mode OR when no branches exist */}
      {(isCustomMode || !hasBranches) && (
        <div>
          <Label className="mb-2 block">{t("cart.deliveryAddress") || "عنوان التوصيل"}</Label>
          <Input
            placeholder={t("cart.enterAddressOrLink") || "أدخل رابط قوقل ماب أو العنوان..."}
            value={customAddress}
            onChange={(e) => onCustomAddressChange(e.target.value)}
            dir="ltr"
          />
        </div>
      )}

      <BranchFormDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} branch={null} />
    </div>
  );
};

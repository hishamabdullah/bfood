import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [mode, setMode] = useState<"branch" | "custom">("branch");

  // Update mode when branches load
  useEffect(() => {
    if (!isLoading && branches.length === 0) {
      setMode("custom");
    }
  }, [branches, isLoading]);

  // Find the default branch
  const defaultBranch = branches.find((b) => b.is_default);

  // Auto-select default branch when branches load
  const handleBranchSelect = (value: string) => {
    if (value === "custom") {
      setMode("custom");
      onBranchChange("", "");
    } else if (value === "add-new") {
      setIsAddDialogOpen(true);
    } else {
      setMode("branch");
      const branch = branches.find((b) => b.id === value);
      if (branch) {
        onBranchChange(branch.id, branch.google_maps_url || branch.address || "");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 w-20 bg-muted rounded mb-2" />
        <div className="h-10 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="flex items-center gap-2 mb-2">
          <Building2 className="h-4 w-4" />
          {t("فرع التوصيل") || "فرع التوصيل"}
        </Label>

        <Select value={mode === "custom" ? "custom" : selectedBranchId} onValueChange={handleBranchSelect}>
          <SelectTrigger>
            <SelectValue placeholder="اختر فرع التوصيل أو أدخل عنوان" />
          </SelectTrigger>
          <SelectContent>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                <div className="flex items-center gap-2">
                  <span>{branch.name}</span>
                  {branch.is_default && <span className="text-xs text-muted-foreground">(افتراضي)</span>}
                </div>
              </SelectItem>
            ))}
            <SelectItem value="custom">
              <div className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                <span>إدخال عنوان يدوياً</span>
              </div>
            </SelectItem>
            <SelectItem value="add-new">
              <div className="flex items-center gap-2 text-primary">
                <Plus className="h-4 w-4" />
                <span>إضافة فرع جديد</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Show selected branch info */}
      {mode === "branch" && selectedBranchId && (
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
                    عرض على الخريطة
                  </a>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Custom address input */}
      {mode === "custom" && (
        <div>
          <Label className="mb-2 block">{t("cart.deliveryAddress")}</Label>
          <Input
            placeholder="أدخل رابط قوقل ماب أو العنوان..."
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

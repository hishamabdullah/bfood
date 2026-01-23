import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateBranch, useUpdateBranch, type Branch } from "@/hooks/useBranches";
import { toast } from "sonner";
import { MapPin, Building2 } from "lucide-react";

interface BranchFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch?: Branch | null;
}

export const BranchFormDialog = ({
  open,
  onOpenChange,
  branch,
}: BranchFormDialogProps) => {
  const [name, setName] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [address, setAddress] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();

  const isEditing = !!branch;

  useEffect(() => {
    if (branch) {
      setName(branch.name);
      setGoogleMapsUrl(branch.google_maps_url || "");
      setAddress(branch.address || "");
      setIsDefault(branch.is_default);
    } else {
      setName("");
      setGoogleMapsUrl("");
      setAddress("");
      setIsDefault(false);
    }
  }, [branch, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("يرجى إدخال اسم الفرع");
      return;
    }

    try {
      if (isEditing && branch) {
        await updateBranch.mutateAsync({
          id: branch.id,
          name: name.trim(),
          google_maps_url: googleMapsUrl.trim() || undefined,
          address: address.trim() || undefined,
          is_default: isDefault,
        });
        toast.success("تم تحديث الفرع بنجاح");
      } else {
        await createBranch.mutateAsync({
          name: name.trim(),
          google_maps_url: googleMapsUrl.trim() || undefined,
          address: address.trim() || undefined,
          is_default: isDefault,
        });
        toast.success("تم إضافة الفرع بنجاح");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error("حدث خطأ أثناء حفظ الفرع");
    }
  };

  const isPending = createBranch.isPending || updateBranch.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {isEditing ? "تعديل الفرع" : "إضافة فرع جديد"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم الفرع *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: الفرع الرئيسي"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">العنوان</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="مثال: شارع الملك فهد، الرياض"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="googleMapsUrl" className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              رابط قوقل ماب
            </Label>
            <Input
              id="googleMapsUrl"
              type="url"
              value={googleMapsUrl}
              onChange={(e) => setGoogleMapsUrl(e.target.value)}
              placeholder="https://maps.google.com/..."
              dir="ltr"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="isDefault"
              checked={isDefault}
              onCheckedChange={(checked) => setIsDefault(checked === true)}
            />
            <Label htmlFor="isDefault" className="cursor-pointer">
              تعيين كفرع افتراضي
            </Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? "جاري الحفظ..." : isEditing ? "تحديث" : "إضافة"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

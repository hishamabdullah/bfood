import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCreateTemplate } from "@/hooks/useOrderTemplates";
import type { CartItem } from "@/contexts/CartContext";
import { Loader2 } from "lucide-react";

interface SaveTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
}

export function SaveTemplateDialog({ open, onOpenChange, items }: SaveTemplateDialogProps) {
  const { t } = useTranslation();
  const createTemplate = useCreateTemplate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSave = async () => {
    if (!name.trim()) return;

    await createTemplate.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      items,
    });

    setName("");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("templates.saveAsTemplate")}</DialogTitle>
          <DialogDescription>
            {t("templates.saveAsTemplateDesc")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">{t("templates.templateName")}</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("templates.templateNamePlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="template-description">
              {t("templates.templateDescription")} ({t("common.optional")})
            </Label>
            <Textarea
              id="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("templates.templateDescriptionPlaceholder")}
              rows={2}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {items.length} {t("templates.products")}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="hero"
            onClick={handleSave}
            disabled={!name.trim() || createTemplate.isPending}
          >
            {createTemplate.isPending ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {t("common.saving")}
              </>
            ) : (
              t("common.save")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

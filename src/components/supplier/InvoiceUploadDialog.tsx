import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Upload, FileText, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface InvoiceUploadDialogProps {
  orderId: string;
  currentInvoiceUrl?: string | null;
}

export function InvoiceUploadDialog({ orderId, currentInvoiceUrl }: InvoiceUploadDialogProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentInvoiceUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("يجب تسجيل الدخول");

      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${orderId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("invoices")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("invoices")
        .getPublicUrl(fileName);

      // Update all order items for this supplier and order with the invoice URL
      const { error: updateError } = await supabase
        .from("order_items")
        .update({ invoice_url: urlData.publicUrl })
        .eq("order_id", orderId)
        .eq("supplier_id", user.id);

      if (updateError) throw updateError;

      return urlData.publicUrl;
    },
    onSuccess: (url) => {
      setPreviewUrl(url);
      toast.success(t("supplier.invoiceUploaded"));
      queryClient.invalidateQueries({ queryKey: ["supplier-orders"] });
      queryClient.invalidateQueries({ queryKey: ["restaurant-orders"] });
      setOpen(false);
    },
    onError: (error) => {
      console.error("Error uploading invoice:", error);
      toast.error(t("supplier.invoiceUploadError"));
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t("supplier.invalidFileType"));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("cart.fileTooLarge"));
      return;
    }

    setUploading(true);
    await uploadMutation.mutateAsync(file);
    setUploading(false);
  };

  const handleRemoveInvoice = async () => {
    if (!user) return;

    try {
      setUploading(true);
      
      const { error } = await supabase
        .from("order_items")
        .update({ invoice_url: null })
        .eq("order_id", orderId)
        .eq("supplier_id", user.id);

      if (error) throw error;

      setPreviewUrl(null);
      toast.success(t("supplier.invoiceRemoved"));
      queryClient.invalidateQueries({ queryKey: ["supplier-orders"] });
      queryClient.invalidateQueries({ queryKey: ["restaurant-orders"] });
    } catch (error) {
      console.error("Error removing invoice:", error);
      toast.error(t("common.error"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={currentInvoiceUrl ? "outline" : "default"}
          size="sm"
          className="gap-1.5"
        >
          {currentInvoiceUrl ? (
            <>
              <FileText className="h-4 w-4" />
              {t("supplier.viewInvoice")}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              {t("supplier.attachInvoice")}
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("supplier.invoiceManagement")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {previewUrl ? (
            <div className="space-y-3">
              <div className="relative border rounded-lg overflow-hidden">
                {previewUrl.toLowerCase().endsWith(".pdf") ? (
                  <div className="p-8 bg-muted/50 flex flex-col items-center justify-center">
                    <FileText className="h-16 w-16 text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">{t("supplier.pdfInvoice")}</p>
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline mt-2 text-sm"
                    >
                      {t("supplier.openInvoice")}
                    </a>
                  </div>
                ) : (
                  <img
                    src={previewUrl}
                    alt={t("supplier.invoicePreview")}
                    className="w-full max-h-[400px] object-contain"
                  />
                )}
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 end-2 h-8 w-8"
                  onClick={handleRemoveInvoice}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="flex gap-2">
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full gap-2">
                    <FileText className="h-4 w-4" />
                    {t("supplier.openInvoice")}
                  </Button>
                </a>
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="gap-2"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {t("supplier.replaceInvoice")}
                </Button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
            >
              {uploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-12 w-12 text-primary animate-spin mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {t("supplier.uploadingInvoice")}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <ImageIcon className="h-8 w-8 text-primary" />
                  </div>
                  <p className="font-medium mb-1">{t("supplier.clickToUpload")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("supplier.supportedFormats")}
                  </p>
                </div>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, ExternalLink, Download, Building2, Check, X } from "lucide-react";
import type { AdminUser } from "@/hooks/useAdminData";

interface UserDocumentsDialogProps {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserDocumentsDialog = ({ user, open, onOpenChange }: UserDocumentsDialogProps) => {
  if (!user) return null;

  const documents = [
    {
      label: "السجل التجاري",
      labelEn: "Commercial Registration",
      url: user.commercial_registration_url,
    },
    {
      label: "الرخصة التجارية",
      labelEn: "Business License",
      url: user.license_url,
    },
    {
      label: "شهادة الضريبة",
      labelEn: "Tax Certificate",
      url: user.tax_certificate_url,
    },
    {
      label: "العنوان الوطني",
      labelEn: "National Address",
      url: user.national_address_url,
    },
  ];

  const uploadedCount = documents.filter(d => d.url).length;
  const allUploaded = uploadedCount === documents.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            وثائق {user.business_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Business name in English */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">اسم المنشأة بالإنجليزي</span>
            </div>
            <p className="text-foreground font-medium" dir="ltr">
              {user.business_name_en || <span className="text-muted-foreground">غير متوفر</span>}
            </p>
          </div>

          {/* Summary badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">حالة الوثائق</span>
            {allUploaded ? (
              <Badge className="bg-primary text-primary-foreground">
                <Check className="h-3 w-3 me-1" />
                جميع الوثائق مرفوعة ({uploadedCount}/4)
              </Badge>
            ) : (
              <Badge variant="secondary">
                <X className="h-3 w-3 me-1" />
                {uploadedCount}/4 وثائق مرفوعة
              </Badge>
            )}
          </div>

          {/* Documents list */}
          <div className="space-y-3">
            {documents.map((doc, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  doc.url ? "border-border bg-card" : "border-dashed border-muted-foreground/30 bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    doc.url ? "bg-primary/10" : "bg-muted"
                  }`}>
                    <FileText className={`h-5 w-5 ${doc.url ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{doc.label}</p>
                    <p className="text-xs text-muted-foreground">{doc.labelEn}</p>
                  </div>
                </div>

                {doc.url ? (
                  <div className="flex items-center gap-2">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm" className="gap-1">
                        <ExternalLink className="h-4 w-4" />
                        عرض
                      </Button>
                    </a>
                    <a
                      href={doc.url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    غير مرفوع
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDocumentsDialog;

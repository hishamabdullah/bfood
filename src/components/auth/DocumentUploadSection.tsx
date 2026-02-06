import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Check, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DocumentUploadSectionProps {
  disabled?: boolean;
  onDocumentsChange: (documents: {
    commercialRegistrationUrl?: string;
    licenseUrl?: string;
    taxCertificateUrl?: string;
    nationalAddressUrl?: string;
  }) => void;
}

interface DocumentState {
  file: File | null;
  uploading: boolean;
  uploaded: boolean;
  url: string | null;
  error: string | null;
}

const DocumentUploadSection = ({ disabled, onDocumentsChange }: DocumentUploadSectionProps) => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const isRTL = i18n.language === "ar";

  const [documents, setDocuments] = useState<{
    commercialRegistration: DocumentState;
    license: DocumentState;
    taxCertificate: DocumentState;
    nationalAddress: DocumentState;
  }>({
    commercialRegistration: { file: null, uploading: false, uploaded: false, url: null, error: null },
    license: { file: null, uploading: false, uploaded: false, url: null, error: null },
    taxCertificate: { file: null, uploading: false, uploaded: false, url: null, error: null },
    nationalAddress: { file: null, uploading: false, uploaded: false, url: null, error: null },
  });

  const fileInputRefs = {
    commercialRegistration: useRef<HTMLInputElement>(null),
    license: useRef<HTMLInputElement>(null),
    taxCertificate: useRef<HTMLInputElement>(null),
    nationalAddress: useRef<HTMLInputElement>(null),
  };

  const documentLabels = {
    commercialRegistration: isRTL ? "السجل التجاري" : "Commercial Registration",
    license: isRTL ? "الرخصة التجارية" : "Business License",
    taxCertificate: isRTL ? "شهادة الضريبة" : "Tax Certificate",
    nationalAddress: isRTL ? "العنوان الوطني" : "National Address",
  };

  const uploadDocument = async (
    key: keyof typeof documents,
    file: File
  ) => {
    // Generate a unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `temp-${timestamp}-${key}.${fileExt}`;

    setDocuments(prev => ({
      ...prev,
      [key]: { ...prev[key], file, uploading: true, error: null },
    }));

    try {
      const { data, error } = await supabase.storage
        .from("registration-documents")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from("registration-documents")
        .getPublicUrl(data.path);

      const url = publicUrlData.publicUrl;

      setDocuments(prev => ({
        ...prev,
        [key]: { file, uploading: false, uploaded: true, url, error: null },
      }));

      // Update parent component
      const newDocuments = {
        ...Object.fromEntries(
          Object.entries(documents).map(([k, v]) => {
            if (k === key) return [getUrlKey(k as keyof typeof documents), url];
            return [getUrlKey(k as keyof typeof documents), v.url];
          })
        ),
      };
      onDocumentsChange(newDocuments as any);

      toast({
        title: isRTL ? "تم رفع الملف بنجاح" : "File uploaded successfully",
        description: documentLabels[key],
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      setDocuments(prev => ({
        ...prev,
        [key]: { ...prev[key], uploading: false, error: error.message },
      }));

      toast({
        title: isRTL ? "فشل رفع الملف" : "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getUrlKey = (key: keyof typeof documents) => {
    const mapping: Record<keyof typeof documents, string> = {
      commercialRegistration: "commercialRegistrationUrl",
      license: "licenseUrl",
      taxCertificate: "taxCertificateUrl",
      nationalAddress: "nationalAddressUrl",
    };
    return mapping[key];
  };

  const handleFileSelect = (key: keyof typeof documents, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: isRTL ? "حجم الملف كبير جداً" : "File too large",
        description: isRTL ? "الحد الأقصى 10 ميجابايت" : "Maximum size is 10MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: isRTL ? "نوع الملف غير مدعوم" : "File type not supported",
        description: isRTL ? "يرجى رفع PDF أو صورة" : "Please upload a PDF or image",
        variant: "destructive",
      });
      return;
    }

    uploadDocument(key, file);
  };

  const removeDocument = (key: keyof typeof documents) => {
    setDocuments(prev => ({
      ...prev,
      [key]: { file: null, uploading: false, uploaded: false, url: null, error: null },
    }));

    // Update parent component
    const newDocuments = {
      ...Object.fromEntries(
        Object.entries(documents).map(([k, v]) => {
          if (k === key) return [getUrlKey(k as keyof typeof documents), undefined];
          return [getUrlKey(k as keyof typeof documents), v.url];
        })
      ),
    };
    onDocumentsChange(newDocuments as any);
  };

  const renderDocumentInput = (key: keyof typeof documents) => {
    const doc = documents[key];
    const label = documentLabels[key];

    return (
      <div key={key} className="space-y-2">
        <Label className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          {label}
          <span className="text-destructive">*</span>
        </Label>

        <input
          ref={fileInputRefs[key]}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={(e) => handleFileSelect(key, e)}
          disabled={disabled || doc.uploading}
        />

        {doc.uploaded && doc.url ? (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border border-border">
            <Check className="h-5 w-5 text-primary" />
            <span className="flex-1 text-sm text-foreground truncate">
              {doc.file?.name || (isRTL ? "تم الرفع" : "Uploaded")}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive/80"
              onClick={() => removeDocument(key)}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : doc.uploading ? (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              {isRTL ? "جاري الرفع..." : "Uploading..."}
            </span>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => fileInputRefs[key].current?.click()}
            disabled={disabled}
          >
            <Upload className="h-4 w-4" />
            {isRTL ? "اختر ملف" : "Choose file"}
            <span className="text-xs text-muted-foreground ms-auto">
              PDF, JPG, PNG
            </span>
          </Button>
        )}

        {doc.error && (
          <p className="text-xs text-destructive">{doc.error}</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <FileText className="h-5 w-5 text-primary" />
        <h3 className="font-medium">
          {isRTL ? "الوثائق المطلوبة" : "Required Documents"}
        </h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {renderDocumentInput("commercialRegistration")}
        {renderDocumentInput("license")}
        {renderDocumentInput("taxCertificate")}
        {renderDocumentInput("nationalAddress")}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {isRTL 
          ? "يُقبل ملفات PDF أو صور (JPG, PNG) بحد أقصى 10 ميجابايت"
          : "Accepted formats: PDF or images (JPG, PNG) - Max 10MB"
        }
      </p>
    </div>
  );
};

export default DocumentUploadSection;

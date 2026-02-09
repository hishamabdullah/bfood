import { useState, useRef } from "react";
import { useSiteSettings, useUploadLogo, useUpdateSiteSetting } from "@/hooks/useSiteSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X, Image as ImageIcon, Sun, Moon } from "lucide-react";
import { toast } from "sonner";

function LogoUploadSection({
  label,
  description,
  logoUrl,
  onFileSelect,
  onRemove,
  isUploading,
  isRemoving,
  icon,
}: {
  label: string;
  description: string;
  logoUrl: string | null | undefined;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  isUploading: boolean;
  isRemoving: boolean;
  icon?: React.ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium flex items-center gap-2">
        {icon}
        {label}
      </Label>
      <p className="text-sm text-muted-foreground">{description}</p>

      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted/50">
          {logoUrl ? (
            <img src={logoUrl} alt={label} className="h-full w-full object-contain" />
          ) : (
            <div className="grid h-10 w-10 place-items-center rounded-xl gradient-primary">
              <span className="text-xl font-bold text-primary-foreground">B</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileSelect}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin me-2" />
            ) : (
              <Upload className="h-4 w-4 me-2" />
            )}
            رفع شعار جديد
          </Button>

          {logoUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={onRemove}
              disabled={isRemoving}
            >
              <X className="h-4 w-4 me-2" />
              إزالة
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminLogoSettings() {
  const { data: settings, isLoading } = useSiteSettings();
  const uploadLogo = useUploadLogo();
  const updateSetting = useUpdateSiteSetting();

  const [headerPreview, setHeaderPreview] = useState<string | null>(null);
  const [headerDarkPreview, setHeaderDarkPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "header_logo" | "header_logo_dark" | "favicon"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("الرجاء اختيار ملف صورة صالح");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("حجم الملف يجب أن يكون أقل من 2 ميجابايت");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (type === "header_logo") setHeaderPreview(result);
      else if (type === "header_logo_dark") setHeaderDarkPreview(result);
      else setFaviconPreview(result);
    };
    reader.readAsDataURL(file);

    uploadLogo.mutate({ file, type });
  };

  const handleRemoveLogo = async (type: "header_logo" | "header_logo_dark" | "favicon") => {
    const keyMap: Record<string, string> = {
      header_logo: "header_logo_url",
      header_logo_dark: "header_logo_dark_url",
      favicon: "favicon_url",
    };
    await updateSetting.mutateAsync({ key: keyMap[type], value: null });

    if (type === "header_logo") setHeaderPreview(null);
    else if (type === "header_logo_dark") setHeaderDarkPreview(null);
    else setFaviconPreview(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const headerLogoUrl = headerPreview || settings?.header_logo_url;
  const headerLogoDarkUrl = headerDarkPreview || settings?.header_logo_dark_url;
  const faviconUrl = faviconPreview || settings?.favicon_url;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            إعدادات الشعار
          </CardTitle>
          <CardDescription>
            قم بتغيير شعار الموقع للوضع النهاري والليلي وأيقونة المتصفح
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Light Mode Logo */}
          <LogoUploadSection
            label="شعار الوضع النهاري"
            description="هذا الشعار يظهر في أعلى الموقع عندما يكون الوضع النهاري (الفاتح) مفعّل"
            logoUrl={headerLogoUrl}
            onFileSelect={(e) => handleFileSelect(e, "header_logo")}
            onRemove={() => handleRemoveLogo("header_logo")}
            isUploading={uploadLogo.isPending}
            isRemoving={updateSetting.isPending}
            icon={<Sun className="h-4 w-4 text-amber-500" />}
          />

          <div className="border-t pt-6" />

          {/* Dark Mode Logo */}
          <LogoUploadSection
            label="شعار الوضع الليلي"
            description="هذا الشعار يظهر في أعلى الموقع عندما يكون الوضع الليلي (الداكن) مفعّل. إذا لم يتم رفعه سيُستخدم شعار الوضع النهاري."
            logoUrl={headerLogoDarkUrl}
            onFileSelect={(e) => handleFileSelect(e, "header_logo_dark")}
            onRemove={() => handleRemoveLogo("header_logo_dark")}
            isUploading={uploadLogo.isPending}
            isRemoving={updateSetting.isPending}
            icon={<Moon className="h-4 w-4 text-blue-400" />}
          />

          <div className="border-t pt-6" />

          {/* Favicon */}
          <LogoUploadSection
            label="أيقونة المتصفح (Favicon)"
            description="هذه الأيقونة تظهر في تبويب المتصفح بجانب عنوان الصفحة"
            logoUrl={faviconUrl || "/favicon.png"}
            onFileSelect={(e) => handleFileSelect(e, "favicon")}
            onRemove={() => handleRemoveLogo("favicon")}
            isUploading={uploadLogo.isPending}
            isRemoving={updateSetting.isPending}
          />

          <p className="text-xs text-muted-foreground">
            💡 ملاحظة: قد يستغرق تحديث أيقونة المتصفح بعض الوقت بسبب الكاش. اضغط Ctrl+Shift+R لتحديث الصفحة.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

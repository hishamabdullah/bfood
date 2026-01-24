import { useState, useRef } from "react";
import { useSiteSettings, useUploadLogo, useUpdateSiteSetting } from "@/hooks/useSiteSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export default function AdminLogoSettings() {
  const { data: settings, isLoading } = useSiteSettings();
  const uploadLogo = useUploadLogo();
  const updateSetting = useUpdateSiteSetting();
  
  const headerInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  
  const [headerPreview, setHeaderPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "header_logo" | "favicon"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("الرجاء اختيار ملف صورة صالح");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("حجم الملف يجب أن يكون أقل من 2 ميجابايت");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      if (type === "header_logo") {
        setHeaderPreview(reader.result as string);
      } else {
        setFaviconPreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);

    // Upload file
    uploadLogo.mutate({ file, type });
  };

  const handleRemoveLogo = async (type: "header_logo" | "favicon") => {
    const key = type === "header_logo" ? "header_logo_url" : "favicon_url";
    await updateSetting.mutateAsync({ key, value: null });
    
    if (type === "header_logo") {
      setHeaderPreview(null);
    } else {
      setFaviconPreview(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const headerLogoUrl = headerPreview || settings?.header_logo_url;
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
            قم بتغيير شعار الموقع في الهيدر وأيقونة المتصفح (Favicon)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Header Logo */}
          <div className="space-y-4">
            <Label className="text-base font-medium">شعار الهيدر</Label>
            <p className="text-sm text-muted-foreground">
              هذا الشعار يظهر في أعلى الموقع بجانب اسم BFOOD
            </p>
            
            <div className="flex items-center gap-4">
              {/* Preview */}
              <div className="h-16 w-16 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted/50">
                {headerLogoUrl ? (
                  <img 
                    src={headerLogoUrl} 
                    alt="شعار الهيدر" 
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="grid h-10 w-10 place-items-center rounded-xl gradient-primary">
                    <span className="text-xl font-bold text-primary-foreground">B</span>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex gap-2">
                <input
                  ref={headerInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, "header_logo")}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => headerInputRef.current?.click()}
                  disabled={uploadLogo.isPending}
                >
                  {uploadLogo.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin me-2" />
                  ) : (
                    <Upload className="h-4 w-4 me-2" />
                  )}
                  رفع شعار جديد
                </Button>
                
                {headerLogoUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => handleRemoveLogo("header_logo")}
                    disabled={updateSetting.isPending}
                  >
                    <X className="h-4 w-4 me-2" />
                    إزالة
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="border-t pt-6" />

          {/* Favicon */}
          <div className="space-y-4">
            <Label className="text-base font-medium">أيقونة المتصفح (Favicon)</Label>
            <p className="text-sm text-muted-foreground">
              هذه الأيقونة تظهر في تبويب المتصفح بجانب عنوان الصفحة
            </p>
            
            <div className="flex items-center gap-4">
              {/* Preview */}
              <div className="h-16 w-16 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted/50">
                {faviconUrl ? (
                  <img 
                    src={faviconUrl} 
                    alt="Favicon" 
                    className="h-12 w-12 object-contain"
                  />
                ) : (
                  <img 
                    src="/favicon.png" 
                    alt="Favicon الافتراضي" 
                    className="h-12 w-12 object-contain"
                  />
                )}
              </div>
              
              {/* Actions */}
              <div className="flex gap-2">
                <input
                  ref={faviconInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, "favicon")}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => faviconInputRef.current?.click()}
                  disabled={uploadLogo.isPending}
                >
                  {uploadLogo.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin me-2" />
                  ) : (
                    <Upload className="h-4 w-4 me-2" />
                  )}
                  رفع أيقونة جديدة
                </Button>
                
                {faviconUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => handleRemoveLogo("favicon")}
                    disabled={updateSetting.isPending}
                  >
                    <X className="h-4 w-4 me-2" />
                    إزالة
                  </Button>
                )}
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground">
              💡 ملاحظة: قد يستغرق تحديث أيقونة المتصفح بعض الوقت بسبب الكاش. اضغط Ctrl+Shift+R لتحديث الصفحة.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useTranslation } from "react-i18next";
import { User, Store, Truck, Building2, ArrowRight, ArrowLeft, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormData, UserType } from "./types";

interface Step2BasicInfoProps {
  formData: FormData;
  userType: UserType;
  onChange: (data: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const Step2BasicInfo = ({ formData, userType, onChange, onNext, onBack }: Step2BasicInfoProps) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const ArrowNextIcon = isRTL ? ArrowLeft : ArrowRight;
  const ArrowBackIcon = isRTL ? ArrowRight : ArrowLeft;

  const isValid = formData.name.trim() && formData.businessName.trim() && formData.businessNameEn.trim();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-sm font-medium mb-2">
          <UserCircle className="h-4 w-4" />
          {isRTL ? "الخطوة الثانية" : "Step 2"}
        </div>
        <h2 className="text-2xl font-bold">{isRTL ? "معلوماتك الأساسية" : "Your Basic Information"}</h2>
        <p className="text-muted-foreground">
          {isRTL ? "أخبرنا عن نفسك ومنشأتك" : "Tell us about yourself and your business"}
        </p>
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            {t("auth.fullName")}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder={isRTL ? "الاسم الكامل" : "Full name"}
            value={formData.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="h-12"
          />
        </div>

        {/* Business Name Arabic */}
        <div className="space-y-2">
          <Label htmlFor="businessName" className="flex items-center gap-2">
            {userType === "restaurant" ? (
              <Store className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Truck className="h-4 w-4 text-muted-foreground" />
            )}
            {userType === "restaurant" ? t("auth.restaurantName") : t("auth.companyName")}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="businessName"
            placeholder={userType === "restaurant" 
              ? (isRTL ? "اسم المطعم" : "Restaurant name") 
              : (isRTL ? "اسم الشركة" : "Company name")
            }
            value={formData.businessName}
            onChange={(e) => onChange({ businessName: e.target.value })}
            className="h-12"
          />
        </div>

        {/* Business Name English */}
        <div className="space-y-2">
          <Label htmlFor="businessNameEn" className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            {isRTL ? "اسم المنشأة بالإنجليزي" : "Business Name (English)"}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="businessNameEn"
            placeholder="Business Name in English"
            value={formData.businessNameEn}
            onChange={(e) => onChange({ businessNameEn: e.target.value })}
            className="h-12"
            dir="ltr"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button 
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1 h-12 gap-2"
        >
          <ArrowBackIcon className="h-4 w-4" />
          {isRTL ? "السابق" : "Back"}
        </Button>
        <Button 
          onClick={onNext}
          disabled={!isValid}
          className="flex-1 h-12 gap-2 group"
        >
          {isRTL ? "التالي" : "Next"}
          <ArrowNextIcon className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
        </Button>
      </div>
    </div>
  );
};

export default Step2BasicInfo;

import { useTranslation } from "react-i18next";
import { ArrowRight, ArrowLeft, FileCheck, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import DocumentUploadSection from "@/components/auth/DocumentUploadSection";
import ServiceAreasSelector from "@/components/auth/ServiceAreasSelector";
import { useSupplierCategories, getSupplierCategoryName } from "@/hooks/useSupplierCategories";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { DocumentUrls, UserType } from "./types";
import i18n from "i18next";

interface Step3DocumentsProps {
  userType: UserType;
  documentUrls: DocumentUrls;
  selectedCategories: string[];
  serviceRegions: string[];
  serviceCities: string[];
  onDocumentsChange: (docs: DocumentUrls) => void;
  onCategoriesChange: (cats: string[]) => void;
  onRegionsChange: (regions: string[]) => void;
  onCitiesChange: (cities: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const Step3Documents = ({
  userType,
  documentUrls,
  selectedCategories,
  serviceRegions,
  serviceCities,
  onDocumentsChange,
  onCategoriesChange,
  onRegionsChange,
  onCitiesChange,
  onNext,
  onBack,
}: Step3DocumentsProps) => {
  const { t } = useTranslation();
  const isRTL = i18n.language === "ar";
  const ArrowNextIcon = isRTL ? ArrowLeft : ArrowRight;
  const ArrowBackIcon = isRTL ? ArrowRight : ArrowLeft;

  const { data: supplierCategories, isLoading: categoriesLoading } = useSupplierCategories();

  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoriesChange(selectedCategories.filter(c => c !== category));
    } else {
      onCategoriesChange([...selectedCategories, category]);
    }
  };

  const allDocsUploaded = 
    !!documentUrls.commercialRegistrationUrl &&
    !!documentUrls.licenseUrl &&
    !!documentUrls.taxCertificateUrl &&
    !!documentUrls.nationalAddressUrl;

  const supplierValid = userType === "supplier" 
    ? (serviceCities.length > 0 && selectedCategories.length > 0)
    : true;

  const isValid = allDocsUploaded && supplierValid;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-sm font-medium mb-2">
          <FileCheck className="h-4 w-4" />
          {isRTL ? "الخطوة الثالثة" : "Step 3"}
        </div>
        <h2 className="text-2xl font-bold">{isRTL ? "الوثائق والتفاصيل" : "Documents & Details"}</h2>
        <p className="text-muted-foreground">
          {isRTL ? "ارفع الوثائق المطلوبة للتحقق من حسابك" : "Upload required documents to verify your account"}
        </p>
      </div>

      <div className="space-y-6">
        {/* Document Upload */}
        <DocumentUploadSection onDocumentsChange={onDocumentsChange} />

        {/* Supplier-specific fields */}
        {userType === "supplier" && (
          <>
            {/* Service Areas */}
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="font-medium">{isRTL ? "مناطق الخدمة" : "Service Areas"}</h3>
              </div>
              <ServiceAreasSelector
                selectedRegions={serviceRegions}
                selectedCities={serviceCities}
                onRegionsChange={onRegionsChange}
                onCitiesChange={onCitiesChange}
              />
            </div>

            {/* Supply Categories */}
            <div className="pt-4 border-t">
              <Label className="block mb-3">{t("auth.categoriesHint")}</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 border rounded-lg bg-muted/30">
                {categoriesLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))
                ) : (
                  supplierCategories?.map((category) => (
                    <label
                      key={category.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedCategories.includes(category.name)}
                        onCheckedChange={() => handleCategoryToggle(category.name)}
                      />
                      <span className="text-sm">
                        {getSupplierCategoryName(category, i18n.language)}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </>
        )}
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

export default Step3Documents;

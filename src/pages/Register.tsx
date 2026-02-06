import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

import StepIndicator from "@/components/auth/registration/StepIndicator";
import Step1UserType from "@/components/auth/registration/Step1UserType";
import Step2BasicInfo from "@/components/auth/registration/Step2BasicInfo";
import Step3Documents from "@/components/auth/registration/Step3Documents";
import Step4Account from "@/components/auth/registration/Step4Account";
import { 
  type UserType, 
  type FormData, 
  type DocumentUrls, 
  initialFormData,
  TOTAL_STEPS 
} from "@/components/auth/registration/types";

const Register = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialType = (searchParams.get("type") as UserType) || "restaurant";
  
  const [currentStep, setCurrentStep] = useState(1);
  const [userType, setUserType] = useState<UserType>(initialType);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [serviceRegions, setServiceRegions] = useState<string[]>([]);
  const [serviceCities, setServiceCities] = useState<string[]>([]);
  const [documentUrls, setDocumentUrls] = useState<DocumentUrls>({});

  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isRTL = i18n.language === "ar";

  const stepLabels = isRTL 
    ? ["نوع الحساب", "المعلومات", "الوثائق", "الدخول"]
    : ["Account Type", "Info", "Documents", "Login"];

  const handleFormChange = (data: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const getRegisterErrorDescription = (error: Error) => {
    const message = error?.message ?? "";

    if (message === "User already registered") return t("auth.userAlreadyExists");
    if (/AbortError/i.test(message)) return t("auth.networkAborted");
    if (/Failed to fetch/i.test(message) || /NetworkError/i.test(message)) return t("auth.networkAborted");

    return message;
  };

  const handleSubmit = async () => {
    if (formData.password.length < 6) {
      toast({
        title: t("auth.passwordTooShort"),
        description: t("auth.passwordMinLength"),
        variant: "destructive",
      });
      return;
    }

    // Validate documents
    const missingDocs = [];
    if (!documentUrls.commercialRegistrationUrl) missingDocs.push(isRTL ? "السجل التجاري" : "Commercial Registration");
    if (!documentUrls.licenseUrl) missingDocs.push(isRTL ? "الرخصة" : "License");
    if (!documentUrls.taxCertificateUrl) missingDocs.push(isRTL ? "شهادة الضريبة" : "Tax Certificate");
    if (!documentUrls.nationalAddressUrl) missingDocs.push(isRTL ? "العنوان الوطني" : "National Address");

    if (missingDocs.length > 0) {
      toast({
        title: isRTL ? "الوثائق مطلوبة" : "Documents required",
        description: isRTL 
          ? `يرجى رفع: ${missingDocs.join("، ")}` 
          : `Please upload: ${missingDocs.join(", ")}`,
        variant: "destructive",
      });
      setCurrentStep(3);
      return;
    }

    if (!formData.businessNameEn.trim()) {
      toast({
        title: isRTL ? "اسم المنشأة بالإنجليزي مطلوب" : "English business name required",
        description: isRTL ? "يرجى إدخال اسم المنشأة بالإنجليزي" : "Please enter the business name in English",
        variant: "destructive",
      });
      setCurrentStep(2);
      return;
    }

    if (userType === "supplier" && serviceCities.length === 0) {
      toast({
        title: isRTL ? "مناطق الخدمة مطلوبة" : "Service areas required",
        description: isRTL ? "الرجاء اختيار مدينة واحدة على الأقل تخدمها" : "Please select at least one city you serve",
        variant: "destructive",
      });
      setCurrentStep(3);
      return;
    }

    if (userType === "supplier" && selectedCategories.length === 0) {
      toast({
        title: t("auth.categoriesRequired"),
        description: t("auth.selectCategory"),
        variant: "destructive",
      });
      setCurrentStep(3);
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(formData.email, formData.password, {
      fullName: formData.name,
      businessName: formData.businessName,
      businessNameEn: formData.businessNameEn,
      phone: formData.phone,
      role: userType,
      region: userType === "supplier" && serviceRegions.length > 0 ? serviceRegions[0] : undefined,
      city: userType === "supplier" && serviceCities.length > 0 ? serviceCities[0] : undefined,
      supplyCategories: userType === "supplier" ? selectedCategories : undefined,
      serviceRegions: userType === "supplier" ? serviceRegions : undefined,
      serviceCities: userType === "supplier" ? serviceCities : undefined,
      commercialRegistrationUrl: documentUrls.commercialRegistrationUrl,
      licenseUrl: documentUrls.licenseUrl,
      taxCertificateUrl: documentUrls.taxCertificateUrl,
      nationalAddressUrl: documentUrls.nationalAddressUrl,
    });

    if (error) {
      toast({
        title: t("auth.registerError"),
        description: getRegisterErrorDescription(error),
        variant: "destructive",
      });
    } else {
      toast({
        title: t("auth.registerSuccess"),
        description: t("auth.welcomeMessage"),
      });
      navigate("/pending-approval");
    }

    setIsLoading(false);
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
            <span className="text-2xl font-bold text-primary-foreground">B</span>
          </div>
          <span className="text-2xl font-bold text-foreground">BFOOD</span>
        </Link>

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-elevated p-6 sm:p-8">
          {/* Step Indicator */}
          <StepIndicator 
            currentStep={currentStep} 
            totalSteps={TOTAL_STEPS} 
            labels={stepLabels}
          />

          {/* Steps Content */}
          {currentStep === 1 && (
            <Step1UserType
              userType={userType}
              onUserTypeChange={setUserType}
              onNext={nextStep}
            />
          )}

          {currentStep === 2 && (
            <Step2BasicInfo
              formData={formData}
              userType={userType}
              onChange={handleFormChange}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}

          {currentStep === 3 && (
            <Step3Documents
              userType={userType}
              documentUrls={documentUrls}
              selectedCategories={selectedCategories}
              serviceRegions={serviceRegions}
              serviceCities={serviceCities}
              onDocumentsChange={setDocumentUrls}
              onCategoriesChange={setSelectedCategories}
              onRegionsChange={setServiceRegions}
              onCitiesChange={setServiceCities}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}

          {currentStep === 4 && (
            <Step4Account
              formData={formData}
              onChange={handleFormChange}
              onSubmit={handleSubmit}
              onBack={prevStep}
              isLoading={isLoading}
            />
          )}

          {/* Login Link */}
          <p className="text-center text-muted-foreground mt-6 pt-6 border-t">
            {t("auth.hasAccount")}{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              {t("auth.loginButton")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

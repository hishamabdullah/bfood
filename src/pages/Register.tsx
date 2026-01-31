import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, Mail, Lock, User, Phone, Store, Truck, Loader2, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { saudiRegions, getRegionName, getCitiesByRegion, getCityName } from "@/data/saudiRegions";
import { useSupplierCategories, getSupplierCategoryName } from "@/hooks/useSupplierCategories";
import ServiceAreasSelector from "@/components/auth/ServiceAreasSelector";
import { Skeleton } from "@/components/ui/skeleton";

type UserType = "restaurant" | "supplier";

const Register = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialType = (searchParams.get("type") as UserType) || "restaurant";
  
  const [userType, setUserType] = useState<UserType>(initialType);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [serviceRegions, setServiceRegions] = useState<string[]>([]);
  const [serviceCities, setServiceCities] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    businessName: "",
    password: "",
    region: "",
    city: "",
  });

  const availableCities = formData.region ? getCitiesByRegion(formData.region) : [];

  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: supplierCategories, isLoading: categoriesLoading } = useSupplierCategories();

  const getRegisterErrorDescription = (error: Error) => {
    const message = error?.message ?? "";

    if (message === "User already registered") return t("auth.userAlreadyExists");
    if (/AbortError/i.test(message)) return t("auth.networkAborted");
    if (/Failed to fetch/i.test(message) || /NetworkError/i.test(message)) return t("auth.networkAborted");

    return message;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password.length < 6) {
      toast({
        title: t("auth.passwordTooShort"),
        description: t("auth.passwordMinLength"),
        variant: "destructive",
      });
      return;
    }

    if (userType === "supplier" && serviceCities.length === 0) {
      toast({
        title: i18n.language === "en" ? "Service areas required" : "مناطق الخدمة مطلوبة",
        description: i18n.language === "en" ? "Please select at least one city you serve" : "الرجاء اختيار مدينة واحدة على الأقل تخدمها",
        variant: "destructive",
      });
      return;
    }

    if (userType === "supplier" && selectedCategories.length === 0) {
      toast({
        title: t("auth.categoriesRequired"),
        description: t("auth.selectCategory"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(formData.email, formData.password, {
      fullName: formData.name,
      businessName: formData.businessName,
      phone: formData.phone,
      role: userType,
      region: userType === "supplier" && serviceRegions.length > 0 ? serviceRegions[0] : undefined,
      city: userType === "supplier" && serviceCities.length > 0 ? serviceCities[0] : undefined,
      supplyCategories: userType === "supplier" ? selectedCategories : undefined,
      serviceRegions: userType === "supplier" ? serviceRegions : undefined,
      serviceCities: userType === "supplier" ? serviceCities : undefined,
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
      // الموردين يذهبون للداشبورد مباشرة، المطاعم لصفحة انتظار الموافقة
      if (userType === "supplier") {
        navigate("/dashboard");
      } else {
        navigate("/pending-approval");
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
            <span className="text-2xl font-bold text-primary-foreground">B</span>
          </div>
          <span className="text-2xl font-bold text-foreground">BFOOD</span>
        </Link>

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-elevated p-8 animate-scale-in">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">{t("auth.createNewAccount")}</h1>
            <p className="text-muted-foreground">{t("auth.joinBfood")}</p>
          </div>

          {/* User Type Toggle */}
          <div className="flex gap-2 p-1 bg-muted rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setUserType("restaurant")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
                userType === "restaurant"
                  ? "bg-card shadow-sm text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              disabled={isLoading}
            >
              <Store className="h-5 w-5" />
              {t("auth.restaurant")}
            </button>
            <button
              type="button"
              onClick={() => setUserType("supplier")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
                userType === "supplier"
                  ? "bg-card shadow-sm text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              disabled={isLoading}
            >
              <Truck className="h-5 w-5" />
              {t("auth.supplier")}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{t("auth.fullName")}</Label>
              <div className="relative">
                <User className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  placeholder={t("auth.fullName")}
                  className="ps-10"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Business Name */}
            <div className="space-y-2">
              <Label htmlFor="businessName">
                {userType === "restaurant" ? t("auth.restaurantName") : t("auth.companyName")}
              </Label>
              <div className="relative">
                {userType === "restaurant" ? (
                  <Store className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                ) : (
                  <Truck className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                )}
                <Input
                  id="businessName"
                  name="businessName"
                  placeholder={userType === "restaurant" ? t("auth.restaurantName") : t("auth.companyName")}
                  className="ps-10"
                  value={formData.businessName}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Supplier Service Areas */}
            {userType === "supplier" && (
              <ServiceAreasSelector
                selectedRegions={serviceRegions}
                selectedCities={serviceCities}
                onRegionsChange={setServiceRegions}
                onCitiesChange={setServiceCities}
                disabled={isLoading}
              />
            )}

            {/* Supplier Categories */}
            {userType === "supplier" && (
              <div className="space-y-2">
                <Label>{t("auth.categoriesHint")}</Label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg">
                  {categoriesLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-6 w-full" />
                    ))
                  ) : (
                    supplierCategories?.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id={category.id}
                          checked={selectedCategories.includes(category.name)}
                          onCheckedChange={() => handleCategoryToggle(category.name)}
                          disabled={isLoading}
                        />
                        <label
                          htmlFor={category.id}
                          className="text-sm cursor-pointer"
                        >
                          {getSupplierCategoryName(category, i18n.language)}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@email.com"
                  className="pr-10"
                  dir="ltr"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">{t("auth.phone")}</Label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="05XXXXXXXX"
                  className="pr-10"
                  dir="ltr"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pr-10"
                  dir="ltr"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button type="submit" variant="hero" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t("auth.creatingAccount")}
                </>
              ) : (
                t("auth.createAccount")
              )}
            </Button>
          </form>

          {/* Login Link */}
          <p className="text-center text-muted-foreground mt-6">
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

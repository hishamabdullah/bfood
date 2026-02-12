import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Store, 
  Truck,
  Loader2,
  Save,
  ExternalLink,
  Copy,
  Check,
  ArrowRight,
  CreditCard,
  Building,
  Camera,
  Upload,
  Volume2,
  VolumeX,
  Settings,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { saudiRegions, saudiCities, supplyCategories, getSupplyCategoryName, getRegionName, getCityName } from "@/data/saudiRegions";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";
import { BranchesManager } from "@/components/branches/BranchesManager";
import { withTimeout } from "@/lib/withTimeout";
import ServiceAreasSelector from "@/components/auth/ServiceAreasSelector";
import { useUserSettings, useUpdateUserSettings } from "@/hooks/useUserSettings";
import { useHasFeature } from "@/hooks/useRestaurantAccess";
import AccountManagerInfo from "@/components/profile/AccountManagerInfo";
import SubUserProfileView from "@/components/profile/SubUserProfileView";
import { useSubUserContext } from "@/hooks/useSubUserContext";

// Sound Settings Component
const SoundSettings = () => {
  const { t } = useTranslation();
  const { data: userSettings, isLoading } = useUserSettings();
  const updateSettings = useUpdateUserSettings();

  const handleSoundToggle = (enabled: boolean) => {
    updateSettings.mutate({ sound_enabled: enabled }, {
      onSuccess: () => {
        toast.success(enabled ? t("profile.soundEnabled") : t("profile.soundDisabled"));
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 pt-6 border-t">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">{t("profile.soundSettings")}</h3>
        </div>
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-6 border-t">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">{t("profile.soundSettings")}</h3>
      </div>
      
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-3">
          {userSettings?.sound_enabled ? (
            <Volume2 className="h-5 w-5 text-primary" />
          ) : (
            <VolumeX className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <p className="font-medium">{t("profile.notificationSounds")}</p>
            <p className="text-sm text-muted-foreground">
              {t("profile.notificationSoundsHint")}
            </p>
          </div>
        </div>
        <Switch
          checked={userSettings?.sound_enabled ?? true}
          onCheckedChange={handleSoundToggle}
          disabled={updateSettings.isPending}
        />
      </div>
    </div>
  );
};

const Profile = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user, userRole, profile: authProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: subUserContext, isLoading: subUserLoading } = useSubUserContext();
  
  const isOwnProfile = !id || id === user?.id;
  const targetUserId = id || user?.id;
  
  // Feature check for branches
  const { hasFeature: canUseBranches } = useHasFeature("can_use_branches");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [targetRole, setTargetRole] = useState<string | null>(null);
  const [customerCode, setCustomerCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [serviceRegions, setServiceRegions] = useState<string[]>([]);
  const [serviceCities, setServiceCities] = useState<string[]>([]);
  const [profileData, setProfileData] = useState({
    full_name: "",
    business_name: "",
    phone: "",
    bio: "",
    google_maps_url: "",
    region: "",
    supply_categories: [] as string[],
    minimum_order_amount: 0,
    default_delivery_fee: 0,
    bank_name: "",
    bank_account_name: "",
    bank_iban: "",
    delivery_option: "with_fee" as "with_fee" | "minimum_only" | "no_delivery",
  });

  useEffect(() => {
    if (!authLoading && !user && isOwnProfile) {
      navigate("/login");
      return;
    }

    if (targetUserId) {
      fetchProfile();
      fetchUserRole();
    }
  }, [targetUserId, authLoading, user]);

  const fetchProfile = async () => {
    if (!targetUserId) return;
    
    try {
      const { data, error } = await withTimeout(
        supabase
          .from("profiles")
          .select("*")
          .eq("user_id", targetUserId)
          .maybeSingle(),
        8000,
        "profile fetch timeout"
      );

      if (error) throw error;
      
      if (data) {
        setProfileData({
          full_name: data.full_name || "",
          business_name: data.business_name || "",
          phone: data.phone || "",
          bio: data.bio || "",
          google_maps_url: data.google_maps_url || "",
          region: data.region || "",
          supply_categories: data.supply_categories || [],
          minimum_order_amount: data.minimum_order_amount || 0,
          default_delivery_fee: data.default_delivery_fee || 0,
          bank_name: (data as any).bank_name || "",
          bank_account_name: (data as any).bank_account_name || "",
          bank_iban: (data as any).bank_iban || "",
          delivery_option: (data as any).delivery_option || "with_fee",
        });
        setCustomerCode(data.customer_code || null);
        setAvatarUrl(data.avatar_url || null);
        setServiceRegions((data as any).service_regions || []);
        setServiceCities((data as any).service_cities || []);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error(t("profile.fetchError"));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserRole = async () => {
    if (!targetUserId) return;
    
    try {
      const { data, error } = await withTimeout(
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", targetUserId)
          .maybeSingle(),
        8000,
        "role fetch timeout"
      );

      if (error) throw error;
      setTargetRole(data?.role || null);
    } catch (error) {
      console.error("Error fetching role:", error);
    }
  };

  const handleSave = async () => {
    if (!user || !isOwnProfile) return;
    
    setIsSaving(true);
    
    try {
      const updateData: Record<string, any> = {
        full_name: profileData.full_name || undefined,
        business_name: profileData.business_name || undefined,
        phone: profileData.phone || null,
        bio: profileData.bio || null,
        google_maps_url: profileData.google_maps_url || null,
        region: profileData.region || null,
      };

      // Supplier-specific fields
      if (targetRole === "supplier") {
        updateData.supply_categories = profileData.supply_categories.length > 0 ? profileData.supply_categories : null;
        updateData.minimum_order_amount = profileData.minimum_order_amount || 0;
        updateData.default_delivery_fee = profileData.default_delivery_fee || 0;
        updateData.bank_name = profileData.bank_name || null;
        updateData.bank_account_name = profileData.bank_account_name || null;
        updateData.bank_iban = profileData.bank_iban || null;
        updateData.service_regions = serviceRegions.length > 0 ? serviceRegions : null;
        updateData.service_cities = serviceCities.length > 0 ? serviceCities : null;
        updateData.delivery_option = profileData.delivery_option || "with_fee";
      }

      // Remove undefined values to avoid sending empty required fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) delete updateData[key];
      });

      const { error } = await supabase
        .from("profiles")
        .update(updateData as any)
        .eq("user_id", user.id);

      if (error) {
        console.error("Profile update error details:", error);
        throw error;
      }
      
      toast.success(t("profile.saveSuccess"));
    } catch (error) {
      console.error("Error saving profile:", error);
      const errMsg = (error as any)?.message || t("profile.saveError");
      toast.error(`${t("profile.saveError")}: ${errMsg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCategoryToggle = (category: string) => {
    setProfileData(prev => ({
      ...prev,
      supply_categories: prev.supply_categories.includes(category)
        ? prev.supply_categories.filter(c => c !== category)
        : [...prev.supply_categories, category]
    }));
  };

  const copyCustomerCode = async () => {
    if (!customerCode) return;
    try {
      await navigator.clipboard.writeText(customerCode);
      setCodeCopied(true);
      toast.success(t("profile.codeCopied"));
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      toast.error(t("profile.copyError"));
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error(t("profile.invalidImageType") || "يجب اختيار ملف صورة");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("profile.imageTooLarge") || "حجم الصورة كبير جداً (الحد الأقصى 2MB)");
      return;
    }

    setIsUploadingLogo(true);

    try {
      // Upload to logos bucket
      const fileExt = file.name.split(".").pop();
      const fileName = `supplier-${user.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("logos")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast.success(t("profile.logoUploaded") || "تم رفع اللوجو بنجاح");
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error(t("profile.logoUploadError") || "حدث خطأ أثناء رفع اللوجو");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  if (authLoading || isLoading || subUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // إذا كان المستخدم موظفاً فرعياً، عرض صفحة الملف الشخصي المخصصة
  if (isOwnProfile && subUserContext?.isSubUser) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1">
          <div className="container py-8 max-w-2xl">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Store className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">{t("profile.title")}</h1>
                <Badge variant="secondary">موظف</Badge>
              </div>
              <p className="text-muted-foreground">بياناتك وصلاحياتك في النظام</p>
            </div>
            <SubUserProfileView />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isSupplier = targetRole === "supplier";
  const isRestaurant = targetRole === "restaurant";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container py-8 max-w-2xl">
          {/* Back Link */}
          {!isOwnProfile && (
            <Link
              to="/suppliers"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowRight className="h-4 w-4 ms-1 rtl:rotate-180" />
              {t("profile.backToSuppliers")}
            </Link>
          )}

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              {isSupplier ? (
                <Truck className="h-8 w-8 text-primary" />
              ) : (
                <Store className="h-8 w-8 text-primary" />
              )}
              <h1 className="text-3xl font-bold">
                {isOwnProfile ? t("profile.title") : profileData.business_name}
              </h1>
            </div>
            <p className="text-muted-foreground">
              {isOwnProfile ? t("profile.updateInfo") : `${isSupplier ? t("auth.supplier") : t("auth.restaurant")}`}
            </p>
          </div>

          {/* Profile Card */}
          <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
            {/* Supplier Logo Upload */}
            {isSupplier && (
              <div className="space-y-2">
                <Label>{t("profile.logo") || "اللوجو"}</Label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border">
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt="Logo" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Truck className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  {isOwnProfile && (
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                        disabled={isUploadingLogo}
                      />
                      <label htmlFor="logo-upload">
                        <Button
                          type="button"
                          variant="outline"
                          className="cursor-pointer"
                          disabled={isUploadingLogo}
                          asChild
                        >
                          <span>
                            {isUploadingLogo ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin me-2" />
                                {t("profile.uploading") || "جاري الرفع..."}
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 me-2" />
                                {avatarUrl 
                                  ? (t("profile.changeLogo") || "تغيير اللوجو")
                                  : (t("profile.uploadLogo") || "رفع اللوجو")
                                }
                              </>
                            )}
                          </span>
                        </Button>
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("profile.logoHint") || "صورة بحجم أقصى 2MB"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name">{t("profile.fullName")}</Label>
              <div className="relative">
                <User className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="full_name"
                  placeholder={t("profile.fullName")}
                  className="ps-10"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  disabled={!isOwnProfile}
                />
              </div>
            </div>

            {/* Business Name */}
            <div className="space-y-2">
              <Label htmlFor="business_name">
                {isSupplier ? t("profile.companyName") : t("profile.restaurantName")}
              </Label>
              <div className="relative">
                {isSupplier ? (
                  <Truck className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                ) : (
                  <Store className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                )}
                <Input
                  id="business_name"
                  placeholder={isSupplier ? t("profile.companyName") : t("profile.restaurantName")}
                  className="ps-10"
                  value={profileData.business_name}
                  onChange={(e) => setProfileData({ ...profileData, business_name: e.target.value })}
                  disabled={!isOwnProfile}
                />
              </div>
            </div>

            {/* Customer Code - For restaurants and suppliers */}
            {isOwnProfile && (isRestaurant || isSupplier) && customerCode && (
              <div className="space-y-2">
                <Label>{isSupplier ? t("profile.supplierCode") : t("profile.customerCode")}</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <span className="text-2xl font-mono font-bold text-primary tracking-widest">
                      {customerCode}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={copyCustomerCode}
                      className="h-8 px-2"
                    >
                      {codeCopied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isSupplier ? t("profile.supplierCodeHint") : t("profile.customerCodeHint")}
                </p>
              </div>
            )}

            {/* Email - Read only from auth */}
            {isOwnProfile && user?.email && (
              <div className="space-y-2">
                <Label>{t("profile.email")}</Label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    value={user.email}
                    className="ps-10 bg-muted"
                    disabled
                    dir="ltr"
                  />
                </div>
              </div>
            )}

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">{t("profile.phone")}</Label>
              <div className="relative">
                <Phone className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="phone"
                  placeholder="05XXXXXXXX"
                  className="ps-10"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  disabled={!isOwnProfile}
                  dir="ltr"
                />
              </div>
              {!isOwnProfile && profileData.phone && (
                <a 
                  href={`tel:${profileData.phone}`}
                  className="text-sm text-primary hover:underline"
                >
                  {t("profile.callNow")}
                </a>
              )}
            </div>

            {/* Google Maps URL */}
            <div className="space-y-2">
              <Label htmlFor="google_maps_url">{t("profile.googleMapsUrl")}</Label>
              <div className="relative">
                <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="google_maps_url"
                  placeholder="https://maps.google.com/..."
                  className="ps-10"
                  value={profileData.google_maps_url}
                  onChange={(e) => setProfileData({ ...profileData, google_maps_url: e.target.value })}
                  disabled={!isOwnProfile}
                  dir="ltr"
                />
              </div>
              {!isOwnProfile && profileData.google_maps_url && (
                <a 
                  href={profileData.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  {t("profile.openInMaps")}
                </a>
              )}
            </div>

            {/* Service Areas - For suppliers */}
            {isSupplier && (
              <div className="space-y-2">
                <Label>{i18n.language === "en" ? "Service Areas" : "مناطق الخدمة"}</Label>
                {isOwnProfile ? (
                  <ServiceAreasSelector
                    selectedRegions={serviceRegions}
                    selectedCities={serviceCities}
                    onRegionsChange={setServiceRegions}
                    onCitiesChange={setServiceCities}
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {serviceCities.length > 0 ? (
                      serviceCities.map((cityName) => {
                        const city = saudiCities.find(c => c.name === cityName);
                        return (
                          <Badge key={cityName} variant="secondary">
                            {city ? getCityName(city, i18n.language) : cityName}
                          </Badge>
                        );
                      })
                    ) : (
                      <span className="text-muted-foreground">{t("profile.notSpecified")}</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Region - For suppliers (main headquarters) */}
            {isSupplier && (
              <div className="space-y-2">
                <Label>{t("profile.region")} ({i18n.language === "en" ? "Headquarters" : "المقر الرئيسي"})</Label>
                {isOwnProfile ? (
                  <Select
                    value={profileData.region}
                    onValueChange={(value) => setProfileData({ ...profileData, region: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("profile.selectRegion")} />
                    </SelectTrigger>
                    <SelectContent>
                      {saudiRegions.map((region) => (
                        <SelectItem key={region.name} value={region.name}>
                          {getRegionName(region, i18n.language)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{profileData.region ? getRegionName(profileData.region, i18n.language) : t("profile.notSpecified")}</span>
                  </div>
                )}
              </div>
            )}

            {/* Supply Categories - For suppliers */}
            {isSupplier && (
              <div className="space-y-2">
                <Label>{t("profile.supplyCategories")}</Label>
                {isOwnProfile ? (
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg">
                    {supplyCategories.map((category) => (
                      <div key={category.name} className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id={`cat-${category.name}`}
                          checked={profileData.supply_categories.includes(category.name)}
                          onCheckedChange={() => handleCategoryToggle(category.name)}
                        />
                        <label
                          htmlFor={`cat-${category.name}`}
                          className="text-sm cursor-pointer"
                        >
                          {getSupplyCategoryName(category, i18n.language)}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profileData.supply_categories.length > 0 ? (
                      profileData.supply_categories.map((cat) => {
                        const categoryObj = supplyCategories.find(c => c.name === cat);
                        const displayName = categoryObj ? getSupplyCategoryName(categoryObj, i18n.language) : cat;
                        return <Badge key={cat} variant="secondary">{displayName}</Badge>;
                      })
                    ) : (
                      <span className="text-muted-foreground">{t("profile.notSpecified")}</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Minimum Order Amount - For suppliers */}
            {isSupplier && (
              <div className="space-y-2">
                <Label htmlFor="minimum_order_amount">{t("profile.minimumOrderAmount")}</Label>
                <Input
                  id="minimum_order_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  value={profileData.minimum_order_amount}
                  onChange={(e) => setProfileData({ ...profileData, minimum_order_amount: parseFloat(e.target.value) || 0 })}
                  disabled={!isOwnProfile}
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground">
                  {t("profile.minimumOrderHint")}
                </p>
              </div>
            )}

            {/* Default Delivery Fee - For suppliers (only show if delivery is enabled) */}
            {isSupplier && profileData.delivery_option !== "no_delivery" && (
              <div className="space-y-2">
                <Label htmlFor="default_delivery_fee">{t("profile.defaultDeliveryFee")}</Label>
                <Input
                  id="default_delivery_fee"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  value={profileData.default_delivery_fee}
                  onChange={(e) => setProfileData({ ...profileData, default_delivery_fee: parseFloat(e.target.value) || 0 })}
                  disabled={!isOwnProfile}
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground">
                  {t("profile.deliveryFeeHint")}
                </p>
              </div>
            )}

            {/* Delivery Options - For suppliers */}
            {isSupplier && isOwnProfile && (
              <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{t("profile.deliveryOptions")}</h3>
                </div>
                
                <RadioGroup
                  value={profileData.delivery_option}
                  onValueChange={(value: "with_fee" | "minimum_only" | "no_delivery") => 
                    setProfileData({ ...profileData, delivery_option: value })
                  }
                  className="space-y-3"
                >
                  {/* Option 1: Delivery with fee */}
                  <Label
                    htmlFor="delivery-with-fee"
                    className="flex items-start gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <RadioGroupItem value="with_fee" id="delivery-with-fee" className="shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-medium block">{t("profile.deliveryWithFee")}</span>
                      <span className="text-sm text-muted-foreground">
                        {t("profile.deliveryWithFeeDesc")}
                      </span>
                    </div>
                  </Label>

                  {/* Option 2: Delivery only after minimum */}
                  <Label
                    htmlFor="delivery-minimum-only"
                    className="flex items-start gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <RadioGroupItem value="minimum_only" id="delivery-minimum-only" className="shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-medium block">{t("profile.deliveryMinimumOnly")}</span>
                      <span className="text-sm text-muted-foreground">
                        {t("profile.deliveryMinimumOnlyDesc", { amount: profileData.minimum_order_amount })}
                      </span>
                    </div>
                  </Label>

                  {/* Option 3: No delivery */}
                  <Label
                    htmlFor="delivery-none"
                    className="flex items-start gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <RadioGroupItem value="no_delivery" id="delivery-none" className="shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-medium block">{t("profile.noDelivery")}</span>
                      <span className="text-sm text-muted-foreground">
                        {t("profile.noDeliveryDesc")}
                      </span>
                    </div>
                  </Label>
                </RadioGroup>
              </div>
            )}

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">{t("profile.bio")}</Label>
              <Textarea
                id="bio"
                placeholder={t("profile.bioPlaceholder")}
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                disabled={!isOwnProfile}
                rows={4}
              />
            </div>

            {/* Bank Details - For suppliers */}
            {isSupplier && isOwnProfile && (
              <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{t("profile.bankDetails")}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("profile.bankDetailsHint")}
                </p>
                
                {/* Bank Name */}
                <div className="space-y-2">
                  <Label htmlFor="bank_name">{t("profile.bankName")}</Label>
                  <div className="relative">
                    <Building className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="bank_name"
                      placeholder={t("profile.bankName")}
                      className="ps-10"
                      value={profileData.bank_name}
                      onChange={(e) => setProfileData({ ...profileData, bank_name: e.target.value })}
                    />
                  </div>
                </div>

                {/* Account Holder Name */}
                <div className="space-y-2">
                  <Label htmlFor="bank_account_name">{t("profile.bankAccountName")}</Label>
                  <div className="relative">
                    <User className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="bank_account_name"
                      placeholder={t("profile.bankAccountName")}
                      className="ps-10"
                      value={profileData.bank_account_name}
                      onChange={(e) => setProfileData({ ...profileData, bank_account_name: e.target.value })}
                    />
                  </div>
                </div>

                {/* IBAN */}
                <div className="space-y-2">
                  <Label htmlFor="bank_iban">{t("profile.bankIban")}</Label>
                  <div className="relative">
                    <CreditCard className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="bank_iban"
                      placeholder="SA..."
                      className="ps-10 font-mono"
                      value={profileData.bank_iban}
                      onChange={(e) => setProfileData({ ...profileData, bank_iban: e.target.value })}
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Sound Settings - For suppliers and restaurants */}
            {isOwnProfile && (isSupplier || isRestaurant) && (
              <SoundSettings />
            )}

            {/* Save Button */}
            {isOwnProfile && (
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="w-full"
                variant="hero"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {t("profile.saving")}
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    {t("profile.saveChanges")}
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Branches Manager - For restaurants only, if feature is enabled */}
          {isOwnProfile && isRestaurant && canUseBranches && (
            <div className="mt-8">
              <BranchesManager />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;

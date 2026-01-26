import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  ArrowRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { saudiRegions, supplyCategories } from "@/data/saudiRegions";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";
import { BranchesManager } from "@/components/branches/BranchesManager";
import { withTimeout } from "@/lib/withTimeout";

const Profile = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user, userRole, profile: authProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const isOwnProfile = !id || id === user?.id;
  const targetUserId = id || user?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [targetRole, setTargetRole] = useState<string | null>(null);
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
        });
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
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profileData.full_name,
          business_name: profileData.business_name,
          phone: profileData.phone,
          bio: profileData.bio,
          google_maps_url: profileData.google_maps_url,
          region: profileData.region || null,
          supply_categories: profileData.supply_categories.length > 0 ? profileData.supply_categories : null,
          minimum_order_amount: profileData.minimum_order_amount || 0,
          default_delivery_fee: profileData.default_delivery_fee || 0,
        })
        .eq("user_id", user.id);

      if (error) throw error;
      
      toast.success(t("profile.saveSuccess"));
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error(t("profile.saveError"));
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

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

            {/* Region - For suppliers */}
            {isSupplier && (
              <div className="space-y-2">
                <Label>{t("profile.region")}</Label>
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
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{profileData.region || t("profile.notSpecified")}</span>
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
                      <div key={category} className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id={`cat-${category}`}
                          checked={profileData.supply_categories.includes(category)}
                          onCheckedChange={() => handleCategoryToggle(category)}
                        />
                        <label
                          htmlFor={`cat-${category}`}
                          className="text-sm cursor-pointer"
                        >
                          {category}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profileData.supply_categories.length > 0 ? (
                      profileData.supply_categories.map((cat) => (
                        <Badge key={cat} variant="secondary">{cat}</Badge>
                      ))
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

            {/* Default Delivery Fee - For suppliers */}
            {isSupplier && (
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

          {/* Branches Manager - For restaurants only */}
          {isOwnProfile && isRestaurant && (
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

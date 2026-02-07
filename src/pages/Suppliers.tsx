import { useState, useMemo } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MapPin, Package, User as UserIcon, Heart, Tags } from "lucide-react";
import { Link } from "react-router-dom";
import { useSuppliers, useRegions } from "@/hooks/useSuppliers";
import { Skeleton } from "@/components/ui/skeleton";
import { saudiRegions, getRegionName, getCitiesByRegion, getCityName } from "@/data/saudiRegions";
import i18n from "i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useFavoriteSuppliers, useToggleFavoriteSupplier } from "@/hooks/useFavorites";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCategoryTranslation } from "@/hooks/useCategoryTranslation";
import { useHasFeature } from "@/hooks/useRestaurantAccess";

interface SupplierCategory {
  id: string;
  name: string;
  name_en: string | null;
  icon: string | null;
}

const Suppliers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  const availableCities = selectedRegion !== "all" ? getCitiesByRegion(selectedRegion) : [];
  
  const { user, userRole } = useAuth();
  const { getCategoryName } = useCategoryTranslation();
  const { data: suppliers, isLoading: suppliersLoading } = useSuppliers(selectedRegion, selectedCity);
  const favoriteSuppliersQuery = useFavoriteSuppliers();
  const favoriteSuppliers = favoriteSuppliersQuery.data ?? [];
  const toggleFavorite = useToggleFavoriteSupplier();
  const { hasFeature: canUseFavorites } = useHasFeature("can_use_favorites");

  // Fetch supplier categories
  const { data: supplierCategories = [] } = useQuery({
    queryKey: ["supplier-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplier_categories")
        .select("*")
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data as SupplierCategory[];
    },
  });

  const handleToggleFavorite = (supplierId: string, isFavorite: boolean) => {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }
    if (userRole !== "restaurant") {
      toast.error("فقط المطاعم يمكنها إضافة للمفضلة");
      return;
    }
    toggleFavorite.mutate({ supplierId, isFavorite });
  };
  const { data: availableRegions } = useRegions();

  const filteredSuppliers = useMemo(() => {
    return suppliers?.filter((supplier) => {
      // Text search filter
      const matchesSearch = 
        supplier.business_name?.includes(searchQuery) ||
        supplier.full_name?.includes(searchQuery) ||
        supplier.region?.includes(searchQuery);
      
      // Category filter
      const matchesCategory = 
        selectedCategory === "all" || 
        supplier.supply_categories?.includes(selectedCategory);
      
      return matchesSearch && matchesCategory;
    }) || [];
  }, [suppliers, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">الموردين</h1>
            <p className="text-muted-foreground">تعرف على شركاء النجاح من الموردين المعتمدين</p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="ابحث عن مورد..."
                className="pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Region Filter */}
            <Select value={selectedRegion} onValueChange={(val) => { setSelectedRegion(val); setSelectedCity("all"); }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <MapPin className="h-4 w-4 ml-2 text-muted-foreground" />
                <SelectValue placeholder={i18n.language === "en" ? "All Regions" : "جميع المناطق"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{i18n.language === "en" ? "All Regions" : "جميع المناطق"}</SelectItem>
                {saudiRegions.map((region) => (
                  <SelectItem key={region.name} value={region.name}>
                    {getRegionName(region, i18n.language)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* City Filter */}
            {selectedRegion !== "all" && availableCities.length > 0 && (
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <MapPin className="h-4 w-4 ml-2 text-muted-foreground" />
                  <SelectValue placeholder={i18n.language === "en" ? "All Cities" : "جميع المدن"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{i18n.language === "en" ? "All Cities" : "جميع المدن"}</SelectItem>
                  {availableCities.map((city) => (
                    <SelectItem key={city.name} value={city.name}>
                      {getCityName(city, i18n.language)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Tags className="h-4 w-4 ml-2 text-muted-foreground" />
                <SelectValue placeholder={i18n.language === "en" ? "All Categories" : "جميع التصنيفات"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{i18n.language === "en" ? "All Categories" : "جميع التصنيفات"}</SelectItem>
                {supplierCategories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {getCategoryName(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Loading State */}
          {suppliersLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-card rounded-2xl border border-border p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Skeleton className="w-16 h-16 rounded-xl" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          )}

          {/* Suppliers Grid */}
          {!suppliersLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSuppliers.map((supplier, index) => (
                <div
                  key={supplier.id}
                  className="bg-card rounded-2xl border border-border p-6 hover:shadow-card transition-all duration-300 animate-fade-in relative"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden relative">
                      {supplier.avatar_url ? (
                        <img 
                          src={supplier.avatar_url} 
                          alt={supplier.business_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserIcon className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    {/* Favorite Button - Only show if feature is enabled */}
                    {userRole === "restaurant" && canUseFavorites && (
                      <button
                        onClick={() => handleToggleFavorite(supplier.user_id, favoriteSuppliers.includes(supplier.user_id))}
                        className="absolute top-4 left-4 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                      >
                        <Heart
                          className={`h-5 w-5 transition-colors ${
                            favoriteSuppliers.includes(supplier.user_id) ? "fill-red-500 text-red-500" : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{supplier.business_name}</h3>
                      <p className="text-sm text-muted-foreground">{supplier.full_name}</p>
                    </div>
                  </div>

                  {/* Supply Categories */}
                  {supplier.supply_categories && supplier.supply_categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {supplier.supply_categories.slice(0, 3).map((cat: string) => (
                        <Badge key={cat} variant="secondary" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                      {supplier.supply_categories.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{supplier.supply_categories.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    {supplier.region && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {supplier.region}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      {supplier.productsCount || 0} منتج
                    </div>
                  </div>

                  {/* Bio */}
                  {supplier.bio && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {supplier.bio}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link to={`/store/${supplier.user_id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        عرض المنتجات
                      </Button>
                    </Link>
                    <Link to={`/profile/${supplier.user_id}`}>
                      <Button variant="ghost" size="icon">
                        <UserIcon className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!suppliersLoading && filteredSuppliers.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">لا توجد نتائج</h3>
              <p className="text-muted-foreground">جرب البحث بكلمات مختلفة أو غير المنطقة</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Suppliers;

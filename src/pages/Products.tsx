import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProductSkeleton from "@/components/products/ProductSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, X, Store, MapPin, Loader2 } from "lucide-react";
import { useProducts, useCategories } from "@/hooks/useProducts";
import { useSupplierProfile } from "@/hooks/useSuppliers";
import { saudiRegions, getRegionName, getCitiesByRegion, getCityName } from "@/data/saudiRegions";
import i18n from "i18next";
import { useCategoryTranslation } from "@/hooks/useCategoryTranslation";
import { useRestaurantAllCustomPrices } from "@/hooks/useCustomPrices";
import { useAuth } from "@/contexts/AuthContext";
import ProductCard from "@/components/products/ProductCard";
import { useSubcategoriesByCategory, getSubcategoryName } from "@/hooks/useSubcategories";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Products = () => {
  const { t } = useTranslation();
  const { userRole } = useAuth();
  const { getCategoryName } = useCategoryTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const supplierId = searchParams.get("supplier");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");

  const availableCities = useMemo(() => 
    selectedRegion !== "all" ? getCitiesByRegion(selectedRegion) : [], 
    [selectedRegion]
  );

  const { 
    data: productsData, 
    isLoading: productsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProducts(selectedCategory, selectedSubcategory);
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: subcategories, isLoading: subcategoriesLoading } = useSubcategoriesByCategory(
    selectedCategory !== "all" ? selectedCategory : null
  );
  const { data: supplierProfile } = useSupplierProfile(supplierId || "");
  const { data: customPrices } = useRestaurantAllCustomPrices();

  // Flatten all pages of products
  const allProducts = useMemo(() => {
    return productsData?.pages.flatMap(page => page.products) || [];
  }, [productsData]);

  // Memoize filtered products to prevent recalculation on every render
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      if (supplierId && product.supplier_id !== supplierId) {
        return false;
      }
      
      // Filter by region - check service_regions first, then fallback to region
      if (selectedRegion !== "all") {
        const supplierProfile = product.supplier_profile as any;
        const serviceRegions = supplierProfile?.service_regions as string[] | null;
        if (serviceRegions && serviceRegions.length > 0) {
          if (!serviceRegions.includes(selectedRegion)) {
            return false;
          }
        } else if (supplierProfile?.region !== selectedRegion) {
          return false;
        }
      }

      // Filter by city - check service_cities first, then fallback to city
      if (selectedCity !== "all") {
        const supplierProfile = product.supplier_profile as any;
        const serviceCities = supplierProfile?.service_cities as string[] | null;
        if (serviceCities && serviceCities.length > 0) {
          if (!serviceCities.includes(selectedCity)) {
            return false;
          }
        } else if (supplierProfile?.city !== selectedCity) {
          return false;
        }
      }
      
      const matchesSearch = 
        product.name.includes(searchQuery) || 
        product.supplier_profile?.business_name?.includes(searchQuery);
      return matchesSearch;
    });
  }, [allProducts, supplierId, selectedRegion, selectedCity, searchQuery]);

  // Infinite scroll observer
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const clearSupplierFilter = useCallback(() => {
    searchParams.delete("supplier");
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

  const handleRegionChange = useCallback((val: string) => { 
    setSelectedRegion(val); 
    setSelectedCity("all"); 
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {supplierId && supplierProfile 
                ? t("products.supplierProducts", { name: supplierProfile.business_name }) 
                : t("products.title")}
            </h1>
            <p className="text-muted-foreground">
              {supplierId ? t("products.subtitle") : t("products.subtitle")}
            </p>
            
            {/* Supplier Filter Badge */}
            {supplierId && supplierProfile && (
              <div className="mt-4 flex items-center gap-2">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
                  <Store className="h-4 w-4" />
                  <span className="font-medium">{supplierProfile.business_name}</span>
                  <button 
                    onClick={clearSupplierFilter}
                    className="hover:bg-primary/20 rounded-full p-1 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <Link to="/suppliers">
                  <Button variant="outline" size="sm">
                    {t("suppliers.viewProducts")}
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder={t("products.searchPlaceholder")}
                className="pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Region Filter */}
            <Select value={selectedRegion} onValueChange={handleRegionChange}>
              <SelectTrigger className="w-full md:w-[180px]">
                <MapPin className="h-4 w-4 ml-2 text-muted-foreground" />
                <SelectValue placeholder={t("suppliers.allRegions")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("suppliers.allRegions")}</SelectItem>
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
                <SelectTrigger className="w-full md:w-[180px]">
                  <MapPin className="h-4 w-4 ml-2 text-muted-foreground" />
                  <SelectValue placeholder={t("suppliers.allCities")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("suppliers.allCities")}</SelectItem>
                  {availableCities.map((city) => (
                    <SelectItem key={city.name} value={city.name}>
                      {getCityName(city, i18n.language)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedCategory("all");
                setSelectedSubcategory("all");
              }}
              className="whitespace-nowrap"
            >
              {t("common.all")}
            </Button>
            {categoriesLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-20" />
              ))
            ) : (
              categories?.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setSelectedSubcategory("all");
                  }}
                  className="whitespace-nowrap"
                >
                  {getCategoryName(category)}
                </Button>
              ))
            )}
          </div>

          {/* Subcategories */}
          {selectedCategory !== "all" && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
              <Button
                variant={selectedSubcategory === "all" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSelectedSubcategory("all")}
                className="whitespace-nowrap"
              >
                {t("common.all")}
              </Button>
              {subcategoriesLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-16" />
                ))
              ) : subcategories && subcategories.length > 0 ? (
                subcategories.map((subcategory) => (
                  <Button
                    key={subcategory.id}
                    variant={selectedSubcategory === subcategory.id ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedSubcategory(subcategory.id)}
                    className="whitespace-nowrap"
                  >
                    {getSubcategoryName(subcategory, i18n.language)}
                  </Button>
                ))
              ) : (
                <span className="text-sm text-muted-foreground py-2">
                  {t("products.noSubcategories")}
                </span>
              )}
            </div>
          )}

          {/* Spacing when no subcategories shown */}
          {selectedCategory === "all" && <div className="mb-4" />}

          {/* Products Grid */}
          {productsLoading ? (
            <ProductSkeleton count={12} />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product, index) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    index={index}
                    customPrice={userRole === "restaurant" ? customPrices?.[product.id] : undefined}
                  />
                ))}
              </div>

              {/* Load More Trigger */}
              <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
                {isFetchingNextPage && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>{t("common.loading")}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Empty State */}
          {!productsLoading && filteredProducts.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">{t("common.noResults")}</h3>
              <p className="text-muted-foreground">{t("products.searchPlaceholder")}</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Products;

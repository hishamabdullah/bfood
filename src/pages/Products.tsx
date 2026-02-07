import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductSkeletonCard } from "@/components/products/ProductSkeleton";
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
import { useSectionsBySubcategory, getSectionName } from "@/hooks/useSections";
import { useProductsWithPriceTiers } from "@/hooks/useProductPriceTiers";
import { useFavoriteProducts, useFavoriteSuppliers } from "@/hooks/useFavorites";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

const Products = () => {
  const { t } = useTranslation();
  const { userRole } = useAuth();
  
  const favoriteProductsQuery = useFavoriteProducts();
  const favoriteSuppliersQuery = useFavoriteSuppliers();

  const favoriteProductIds = favoriteProductsQuery.data ?? [];
  const favoriteSupplierIds = favoriteSuppliersQuery.data ?? [];

  const { getCategoryName } = useCategoryTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const supplierId = searchParams.get("supplier");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [selectedSection, setSelectedSection] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");
  const [categorySearch, setCategorySearch] = useState("");
  const [subcategorySearch, setSubcategorySearch] = useState("");
  const [sectionSearch, setSectionSearch] = useState("");

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
  } = useProducts(selectedCategory, selectedSubcategory, true);

  const isPageLoading = productsLoading;

  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: subcategories, isLoading: subcategoriesLoading } = useSubcategoriesByCategory(
    selectedCategory !== "all" ? selectedCategory : null
  );
  const { data: sections, isLoading: sectionsLoading } = useSectionsBySubcategory(
    selectedSubcategory !== "all" ? selectedSubcategory : null
  );
  const { data: supplierProfile } = useSupplierProfile(supplierId || "");
  const { data: customPrices } = useRestaurantAllCustomPrices();
  const { data: productsWithTiers = [] } = useProductsWithPriceTiers();

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    if (!categorySearch) return categories;
    return categories.filter((cat) =>
      getCategoryName(cat).toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categories, categorySearch, getCategoryName]);

  // Filter subcategories based on search
  const filteredSubcategories = useMemo(() => {
    if (!subcategories) return [];
    if (!subcategorySearch) return subcategories;
    return subcategories.filter((sub) =>
      getSubcategoryName(sub, i18n.language).toLowerCase().includes(subcategorySearch.toLowerCase())
    );
  }, [subcategories, subcategorySearch]);

  // Filter sections based on search
  const filteredSections = useMemo(() => {
    if (!sections) return [];
    if (!sectionSearch) return sections;
    return sections.filter((sec) =>
      getSectionName(sec, i18n.language).toLowerCase().includes(sectionSearch.toLowerCase())
    );
  }, [sections, sectionSearch]);

  // Flatten products
  const allProducts = useMemo(() => {
    return productsData?.pages.flatMap((page) => page.products) || [];
  }, [productsData]);

  // Memoize filtered products to prevent recalculation on every render
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      if (supplierId && product.supplier_id !== supplierId) {
        return false;
      }

      // Filter by section (third level)
      if (selectedSection !== "all") {
        if ((product as any).section_id !== selectedSection) {
          return false;
        }
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
  }, [
    allProducts,
    supplierId,
    selectedSection,
    selectedRegion,
    selectedCity,
    searchQuery,
  ]);

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

          {/* Categories Search and Buttons */}
          <div className="mb-4">
            {/* Category Search */}
            <div className="relative mb-3 max-w-xs">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("products.searchCategories")}
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="ps-9 h-9"
              />
              {categorySearch && (
                <button
                  onClick={() => setCategorySearch("")}
                  className="absolute end-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
            
            {/* Category Buttons */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedSubcategory("all");
                  setSelectedSection("all");
                  setCategorySearch("");
                  setSubcategorySearch("");
                  setSectionSearch("");
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
                filteredCategories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setSelectedSubcategory("all");
                      setSelectedSection("all");
                      setSubcategorySearch("");
                      setSectionSearch("");
                    }}
                    className="whitespace-nowrap"
                  >
                    {getCategoryName(category)}
                  </Button>
                ))
              )}
            </div>
          </div>

          {/* Subcategories */}
          {selectedCategory !== "all" && (
            <div className="mb-4">
              {/* Subcategory Search */}
              {subcategories && subcategories.length > 3 && (
                <div className="relative mb-3 max-w-xs">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("products.searchCategories")}
                    value={subcategorySearch}
                    onChange={(e) => setSubcategorySearch(e.target.value)}
                    className="ps-9 h-9"
                  />
                  {subcategorySearch && (
                    <button
                      onClick={() => setSubcategorySearch("")}
                      className="absolute end-3 top-1/2 -translate-y-1/2"
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </div>
              )}
              
              {/* Subcategory Buttons */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedSubcategory("all");
                    setSelectedSection("all");
                    setSectionSearch("");
                  }}
                  className={`whitespace-nowrap border-primary text-primary hover:bg-primary/15 ${
                    selectedSubcategory === "all" ? "bg-primary/25 font-semibold" : ""
                  }`}
                >
                  {t("common.all")}
                </Button>
                {subcategoriesLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-20" />
                  ))
                ) : (
                  filteredSubcategories.map((sub) => (
                    <Button
                      key={sub.id}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSubcategory(sub.id);
                        setSelectedSection("all");
                        setSectionSearch("");
                      }}
                      className={`whitespace-nowrap border-primary text-primary hover:bg-primary/15 ${
                        selectedSubcategory === sub.id ? "bg-primary/25 font-semibold" : ""
                      }`}
                    >
                      {getSubcategoryName(sub, i18n.language)}
                    </Button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Sections (Third Level) */}
          {selectedSubcategory !== "all" && (
            <div className="mb-6">
              {/* Section Search */}
              {sections && sections.length > 3 && (
                <div className="relative mb-3 max-w-xs">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("products.searchCategories")}
                    value={sectionSearch}
                    onChange={(e) => setSectionSearch(e.target.value)}
                    className="ps-9 h-9"
                  />
                  {sectionSearch && (
                    <button
                      onClick={() => setSectionSearch("")}
                      className="absolute end-3 top-1/2 -translate-y-1/2"
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </div>
              )}
              
              {/* Section Buttons */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSection("all")}
                  className={`whitespace-nowrap border-secondary text-secondary-foreground hover:bg-secondary/15 ${
                    selectedSection === "all" ? "bg-secondary/25 font-semibold" : ""
                  }`}
                >
                  {t("common.all")}
                </Button>
                {sectionsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-20" />
                  ))
                ) : (
                  filteredSections.map((sec) => (
                    <Button
                      key={sec.id}
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSection(sec.id)}
                      className={`whitespace-nowrap border-secondary text-secondary-foreground hover:bg-secondary/15 ${
                        selectedSection === sec.id ? "bg-secondary/25 font-semibold" : ""
                      }`}
                    >
                      {getSectionName(sec, i18n.language)}
                    </Button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Products Grid */}
          {isPageLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <ProductSkeletonCard key={i} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">{t("common.noResults")}</h3>
              <p className="text-muted-foreground">{t("products.noProducts")}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    customPrice={customPrices?.[product.id] ?? null}
                    hasPriceTiers={productsWithTiers.includes(product.id)}
                    index={index}
                  />
                ))}
              </div>
              
              {/* Load More Trigger */}
              <div ref={loadMoreRef} className="py-8 flex justify-center">
                {isFetchingNextPage && (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                )}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Products;

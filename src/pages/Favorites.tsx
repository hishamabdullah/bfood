import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Heart, MapPin, User as UserIcon, Loader2, Lock } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useFavoriteProducts, useFavoriteSuppliers } from "@/hooks/useFavorites";
import { useHasFeature } from "@/hooks/useRestaurantAccess";
import ProductCard from "@/components/products/ProductCard";

const Favorites = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("products");
  const { hasFeature, isLoading: featureLoading } = useHasFeature("can_use_favorites");
  
  const { data: favoriteProductIds = [], isLoading: favProductsLoading } = useFavoriteProducts();
  const { data: favoriteSupplierIds = [], isLoading: favSuppliersLoading } = useFavoriteSuppliers();
  const { data: productsData, isLoading: productsLoading } = useProducts("all");
  const { data: allSuppliers, isLoading: suppliersLoading } = useSuppliers("all");

  // Flatten all pages of products
  const allProducts = useMemo(() => {
    return productsData?.pages.flatMap(page => page.products) || [];
  }, [productsData]);

  const favoriteProducts = allProducts.filter((p) => favoriteProductIds.includes(p.id));
  const favoriteSuppliers = allSuppliers?.filter((s) => favoriteSupplierIds.includes(s.user_id)) || [];

  const isLoading = favProductsLoading || favSuppliersLoading || productsLoading || suppliersLoading || featureLoading;

  // Show feature disabled message
  if (!featureLoading && !hasFeature) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Lock className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{t("subscription.featureDisabled")}</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              {t("subscription.favoritesDisabled")}
            </p>
            <Link to="/dashboard">
              <Button variant="hero">{t("nav.dashboard")}</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Heart className="h-8 w-8 text-red-500 fill-red-500" />
              <h1 className="text-3xl font-bold">المفضلة</h1>
            </div>
            <p className="text-muted-foreground">
              المنتجات والموردين المفضلين لديك
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="products" className="gap-2">
                  <Package className="h-4 w-4" />
                  المنتجات ({favoriteProducts.length})
                </TabsTrigger>
                <TabsTrigger value="suppliers" className="gap-2">
                  <UserIcon className="h-4 w-4" />
                  الموردين ({favoriteSuppliers.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="products">
                {favoriteProducts.length === 0 ? (
                  <div className="text-center py-16">
                    <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">لا توجد منتجات مفضلة</h3>
                    <p className="text-muted-foreground mb-4">
                      أضف منتجات للمفضلة للوصول إليها بسرعة
                    </p>
                    <Link to="/products">
                      <Button variant="hero">تصفح المنتجات</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {favoriteProducts.map((product, index) => (
                      <ProductCard key={product.id} product={product} index={index} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="suppliers">
                {favoriteSuppliers.length === 0 ? (
                  <div className="text-center py-16">
                    <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">لا يوجد موردين مفضلين</h3>
                    <p className="text-muted-foreground mb-4">
                      أضف موردين للمفضلة للوصول إليهم بسرعة
                    </p>
                    <Link to="/suppliers">
                      <Button variant="hero">تصفح الموردين</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favoriteSuppliers.map((supplier, index) => (
                      <div
                        key={supplier.id}
                        className="bg-card rounded-2xl border border-border p-6 hover:shadow-card transition-all duration-300 animate-fade-in"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
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
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{supplier.business_name}</h3>
                            <p className="text-sm text-muted-foreground">{supplier.full_name}</p>
                          </div>
                        </div>

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

                        <div className="flex gap-2">
                          <Link to={`/store/${supplier.user_id}`} className="flex-1">
                            <Button variant="outline" className="w-full">
                              عرض المتجر
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
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Favorites;

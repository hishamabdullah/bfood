import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Package, 
  MapPin, 
  Phone, 
  Store,
  ShoppingBag,
  ArrowRight,
  Heart,
  Truck,
  TruckIcon,
  BadgeCheck,
  XCircle
} from "lucide-react";
import { usePublicSupplierStore } from "@/hooks/usePublicSupplierStore";
import { useProductTranslation } from "@/hooks/useProductTranslation";
import { useCategoryTranslation } from "@/hooks/useCategoryTranslation";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useFavoriteSuppliers, useToggleFavoriteSupplier } from "@/hooks/useFavorites";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useHasFeature } from "@/hooks/useRestaurantAccess";
import { getRegionName, getCityName, saudiRegions, saudiCities } from "@/data/saudiRegions";

export default function SupplierStore() {
  const { supplierId } = useParams<{ supplierId: string }>();
  const { t, i18n } = useTranslation();
  const { data, isLoading, error } = usePublicSupplierStore(supplierId || "");
  const { getProductName } = useProductTranslation();
  const { getCategoryName } = useCategoryTranslation();
  const { user, userRole, isApproved } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { data: favoriteSuppliers = [] } = useFavoriteSuppliers();
  const toggleFavorite = useToggleFavoriteSupplier();
  const { hasFeature: canUseFavorites } = useHasFeature("can_use_favorites");
  const { hasFeature: canOrderFeature } = useHasFeature("can_order");

  const canOrder = user && userRole === "restaurant" && isApproved && canOrderFeature;
  const isFavorite = supplierId ? favoriteSuppliers.includes(supplierId) : false;

  const handleToggleFavorite = () => {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      navigate("/login");
      return;
    }
    if (userRole !== "restaurant") {
      toast.error("فقط المطاعم يمكنها إضافة للمفضلة");
      return;
    }
    if (supplierId) {
      toggleFavorite.mutate({ supplierId, isFavorite });
    }
  };

  const handleAddToCart = (product: any) => {
    if (!user) {
      toast.error(t("auth.loginRequired") || "يجب تسجيل الدخول أولاً");
      navigate("/login");
      return;
    }
    
    if (userRole !== "restaurant") {
      toast.error("فقط المطاعم يمكنها إضافة منتجات للسلة");
      return;
    }

    if (!isApproved) {
      toast.error("يجب أن يتم اعتماد حسابك أولاً");
      return;
    }
    
    addItem(product, 1);
    toast.success(`تم إضافة ${getProductName(product)} للسلة`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">
              {i18n.language === "ar" ? "المتجر غير موجود" : "Store not found"}
            </h1>
            <p className="text-muted-foreground mb-4">
              {i18n.language === "ar" 
                ? "لم نتمكن من العثور على هذا المتجر" 
                : "We couldn't find this store"}
            </p>
            <Link to="/">
              <Button>
                {i18n.language === "ar" ? "العودة للرئيسية" : "Back to Home"}
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { supplier, products } = data;

  // Get unique categories from products
  const categories = Array.from(
    new Set(products.filter(p => p.category).map(p => p.category?.id))
  ).map(catId => products.find(p => p.category?.id === catId)?.category).filter(Boolean);

  // Filter products by category
  const filteredProducts = selectedCategory === "all" 
    ? products 
    : products.filter(p => p.category?.id === selectedCategory);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Supplier Header */}
        <div className="bg-gradient-to-b from-primary/10 to-background">
          <div className="container py-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-card border overflow-hidden shrink-0">
                {supplier.avatar_url ? (
                  <img
                    src={supplier.avatar_url}
                    alt={supplier.business_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Store className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold mb-1">
                  {supplier.business_name}
                </h1>
                {supplier.customer_code && (
                  <p className="text-sm text-muted-foreground mb-2 font-mono">
                    #{supplier.customer_code}
                  </p>
                )}
                
                {supplier.bio && (
                  <p className="text-muted-foreground mb-3 max-w-2xl">
                    {supplier.bio}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {supplier.region && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{supplier.region}{supplier.city && ` - ${supplier.city}`}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    <span>{products.length} {i18n.language === "ar" ? "منتج" : "products"}</span>
                  </div>
                  {supplier.minimum_order_amount && supplier.minimum_order_amount > 0 && (
                    <div className="flex items-center gap-1">
                      <ShoppingBag className="h-4 w-4" />
                      <span>
                        {i18n.language === "ar" ? "الحد الأدنى: " : "Min order: "}
                        {supplier.minimum_order_amount} {t("common.sar")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Delivery Info Section */}
                <div className="mt-4 p-4 bg-card rounded-xl border space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" />
                    {i18n.language === "ar" ? "معلومات التوصيل" : "Delivery Information"}
                  </h3>
                  
                  {/* Delivery Status */}
                  <div className="flex flex-wrap gap-3">
                    {supplier.delivery_option === "no_delivery" ? (
                      <Badge variant="outline" className="bg-destructive/10 border-destructive/30 text-destructive">
                        <XCircle className="h-3.5 w-3.5 ltr:mr-1.5 rtl:ml-1.5" />
                        {i18n.language === "ar" ? "لا يتوفر توصيل - استلام من المستودع فقط" : "No delivery - Warehouse pickup only"}
                      </Badge>
                    ) : (
                      <>
                        <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary">
                          <BadgeCheck className="h-3.5 w-3.5 ltr:mr-1.5 rtl:ml-1.5" />
                          {i18n.language === "ar" ? "يتوفر توصيل" : "Delivery available"}
                        </Badge>
                        
                        {/* Delivery Fee */}
                        {supplier.delivery_option === "with_fee" && supplier.default_delivery_fee != null && supplier.default_delivery_fee > 0 && (
                          <Badge variant="secondary">
                            <Truck className="h-3.5 w-3.5 ltr:mr-1.5 rtl:ml-1.5" />
                            {i18n.language === "ar" 
                              ? `رسوم التوصيل: ${supplier.default_delivery_fee} ${t("common.sar")}` 
                              : `Delivery fee: ${supplier.default_delivery_fee} ${t("common.sar")}`}
                          </Badge>
                        )}
                        
                        {/* Free Delivery Threshold */}
                        {supplier.minimum_order_amount != null && supplier.minimum_order_amount > 0 && (
                          <Badge variant="outline" className="bg-accent/50 border-accent text-accent-foreground">
                            <ShoppingBag className="h-3.5 w-3.5 ltr:mr-1.5 rtl:ml-1.5" />
                            {i18n.language === "ar" 
                              ? `توصيل مجاني للطلبات فوق ${supplier.minimum_order_amount} ${t("common.sar")}` 
                              : `Free delivery for orders above ${supplier.minimum_order_amount} ${t("common.sar")}`}
                          </Badge>
                        )}

                        {supplier.delivery_option === "minimum_only" && (
                          <Badge variant="outline" className="bg-muted border-muted-foreground/30 text-muted-foreground">
                            {i18n.language === "ar" 
                              ? "التوصيل متاح فقط عند تجاوز الحد الأدنى" 
                              : "Delivery only available above minimum order"}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* Service Regions */}
                  {(supplier.service_regions && supplier.service_regions.length > 0) && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        {i18n.language === "ar" ? "مناطق الخدمة:" : "Service areas:"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {supplier.service_regions.map((region) => (
                          <Badge key={region} variant="outline" className="text-xs">
                            {getRegionName(region, i18n.language)}
                          </Badge>
                        ))}
                      </div>
                      
                      {/* Service Cities */}
                      {supplier.service_cities && supplier.service_cities.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground mb-1.5">
                            {i18n.language === "ar" ? "المدن المخدومة:" : "Served cities:"}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {supplier.service_cities.map((city) => (
                              <Badge key={city} variant="secondary" className="text-xs font-normal">
                                {getCityName(city, i18n.language)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {userRole === "restaurant" && canUseFavorites && (
                  <div className="flex items-center gap-3 mt-4 p-3 bg-card rounded-lg border">
                    <button
                      onClick={handleToggleFavorite}
                      className="p-2 rounded-full bg-background hover:bg-muted transition-colors"
                    >
                      <Heart
                        className={`h-6 w-6 transition-colors ${
                          isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
                        }`}
                      />
                    </button>
                    <span className="text-sm text-muted-foreground">
                      {i18n.language === "ar" 
                        ? "فضّل المورد لتستطيع العودة إليه بشكل أسهل في صفحة المفضلة" 
                        : "Favorite this supplier to easily find them in your favorites page"}
                    </span>
                  </div>
                )}

                {!canOrder && (
                  <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    {!user ? (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {i18n.language === "ar" 
                              ? `أنشئ حساب لتستطيع تصفح منتجات ${supplier.business_name}` 
                              : `Create an account to browse ${supplier.business_name}'s products`}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {i18n.language === "ar" 
                              ? "سجل كمطعم للطلب مباشرة من المورد" 
                              : "Register as a restaurant to order directly from the supplier"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Link to="/register?type=restaurant">
                            <Button>
                              {i18n.language === "ar" ? "إنشاء حساب" : "Create Account"}
                            </Button>
                          </Link>
                          <Link to="/login">
                            <Button variant="outline">
                              {t("auth.login")}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ) : userRole !== "restaurant" ? (
                      <span className="text-sm">
                        {i18n.language === "ar" 
                          ? "فقط المطاعم يمكنها الطلب" 
                          : "Only restaurants can place orders"}
                      </span>
                    ) : !isApproved ? (
                      <span className="text-sm">
                        {i18n.language === "ar" 
                          ? "حسابك قيد المراجعة" 
                          : "Your account is pending approval"}
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="border-b bg-card/50">
            <div className="container py-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("all")}
                >
                  {i18n.language === "ar" ? "الكل" : "All"}
                </Button>
                {categories.map((cat) => cat && (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {getCategoryName(cat)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="container py-8">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                {i18n.language === "ar" ? "لا توجد منتجات" : "No products"}
              </h2>
              <p className="text-muted-foreground">
                {i18n.language === "ar" 
                  ? "لم يتم إضافة منتجات بعد" 
                  : "No products have been added yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Link 
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="block"
                >
                  <div
                    className="bg-card rounded-2xl border overflow-hidden hover:shadow-card transition-all duration-300 group cursor-pointer"
                  >
                    {/* Product Image */}
                    <div className="aspect-[4/3] bg-white flex items-center justify-center overflow-hidden p-2">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={getProductName(product)}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <Package className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-lg truncate mb-1">
                        {getProductName(product)}
                      </h3>
                      
                      {product.category && (
                        <Badge variant="secondary" className="mb-2">
                          {getCategoryName(product.category)}
                        </Badge>
                      )}

                      <div className="flex items-center justify-between mt-3">
                        <div>
                          <span className="text-xl font-bold text-primary">
                            {product.price}
                          </span>
                          <span className="text-sm text-muted-foreground ltr:ml-1 rtl:mr-1">
                            {t("common.sar")}/{product.unit}
                          </span>
                        </div>
                        
                        {canOrder && (
                          <Button 
                            size="sm" 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAddToCart(product);
                            }}
                          >
                            <ShoppingBag className="h-4 w-4" />
                            {i18n.language === "ar" ? "أضف" : "Add"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

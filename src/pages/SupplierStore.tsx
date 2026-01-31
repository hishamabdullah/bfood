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
  Heart
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

  const canOrder = user && userRole === "restaurant" && isApproved;
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
                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                  {supplier.business_name}
                </h1>
                
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

                {/* Favorite Button for Restaurants */}
                {userRole === "restaurant" && (
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
                <div
                  key={product.id}
                  className="bg-card rounded-2xl border overflow-hidden hover:shadow-card transition-all duration-300 group"
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
                          onClick={() => handleAddToCart(product)}
                        >
                          <ShoppingBag className="h-4 w-4" />
                          {i18n.language === "ar" ? "أضف" : "Add"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

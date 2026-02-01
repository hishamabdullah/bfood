import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProduct } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useProductTranslation } from "@/hooks/useProductTranslation";
import { useRestaurantCustomPrice } from "@/hooks/useCustomPrices";
import { useProductPriceTiers } from "@/hooks/useProductPriceTiers";
import { ArrowRight, Minus, Plus, ShoppingCart, Package, MapPin, Scale, Store, Tag, Layers } from "lucide-react";
import { toast } from "sonner";

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { getProductName, getProductDescription } = useProductTranslation();
  const { data: product, isLoading, error } = useProduct(id || "");
  const { addItem } = useCart();
  const { user, userRole } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const { data: customPrice } = useRestaurantCustomPrice(id || "");
  const { data: priceTiers = [] } = useProductPriceTiers(id || "");

  const hasCustomPrice = userRole === "restaurant" && customPrice !== null && customPrice !== undefined && customPrice !== product?.price;
  // Custom price takes priority over price tiers
  const hasPriceTiers = priceTiers.length > 0 && !hasCustomPrice;
  
  // Calculate price based on quantity and tiers (only if no custom price)
  const getTieredPrice = () => {
    if (hasCustomPrice) return customPrice!;
    if (!hasPriceTiers || !product) return product?.price || 0;
    
    // Find the applicable tier based on quantity
    const applicableTier = [...priceTiers]
      .sort((a, b) => b.min_quantity - a.min_quantity)
      .find(tier => quantity >= tier.min_quantity);
    
    return applicableTier ? applicableTier.price_per_unit : product.price;
  };
  
  const displayPrice = getTieredPrice();

  const handleAddToCart = () => {
    if (!user) {
      toast.error(t("auth.loginRequired") || "يجب تسجيل الدخول أولاً");
      navigate("/login");
      return;
    }
    
    if (userRole !== "restaurant") {
      toast.error("فقط المطاعم يمكنها إضافة منتجات للسلة");
      return;
    }
    
    if (product) {
      // إضافة المنتج بالسعر المخصص أو سعر الشريحة
      const productWithPrice = { ...product, price: displayPrice };
      addItem(productWithPrice, quantity);
      toast.success(`تم إضافة ${getProductName(product)} للسلة`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1">
          <div className="container py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Skeleton className="h-96 rounded-2xl" />
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold mb-2">{t("common.noResults")}</h2>
            <p className="text-muted-foreground mb-6">عذراً، لم نتمكن من العثور على هذا المنتج</p>
            <Link to="/products">
              <Button variant="hero">
                <ArrowRight className="h-5 w-5" />
                {t("nav.products")}
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const productName = getProductName(product);
  const productDescription = getProductDescription(product);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/products" className="hover:text-primary transition-colors">
              {t("nav.products")}
            </Link>
            <span>/</span>
            {product.category && (
              <>
                <span>{product.category.name}</span>
                <span>/</span>
              </>
            )}
            <span className="text-foreground">{productName}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Image */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden relative">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={productName}
                  className="w-full h-96 object-cover"
                />
              ) : (
                <div className="w-full h-96 bg-muted flex items-center justify-center">
                  <Package className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
              {/* Custom Price Badge */}
              {hasCustomPrice && (
                <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-green-500 text-white text-sm font-medium flex items-center gap-1.5">
                  <Tag className="h-4 w-4" />
                  سعر خاص لك
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant={product.in_stock ? "default" : "secondary"}>
                    {product.in_stock ? t("products.inStock") : t("products.outOfStock")}
                  </Badge>
                  {product.category && (
                    <Badge variant="outline">{product.category.name}</Badge>
                  )}
                </div>
                <h1 className="text-3xl font-bold mb-2">{productName}</h1>
                {product.supplier_profile && (
                  <Link 
                    to={`/suppliers`} 
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Store className="h-4 w-4" />
                    {product.supplier_profile.business_name}
                  </Link>
                )}
              </div>

              {/* Price */}
              <div className="bg-accent/50 rounded-xl p-4">
                <span className="text-3xl font-bold text-primary">{displayPrice}</span>
                <span className="text-lg text-muted-foreground ltr:ml-2 rtl:mr-2">{t("common.sar")} / {product.unit}</span>
                {hasCustomPrice && (
                  <div className="mt-1">
                    <span className="text-sm text-muted-foreground line-through">
                      السعر الأصلي: {product.price} {t("common.sar")}
                    </span>
                  </div>
                )}
                {hasPriceTiers && displayPrice !== product.price && (
                  <div className="mt-1">
                    <span className="text-sm text-green-600 font-medium">
                      {i18n.language === "ar" ? "سعر الشريحة مُطبّق!" : "Tier price applied!"}
                    </span>
                  </div>
                )}
              </div>

              {/* Price Tiers */}
              {hasPriceTiers && (
                <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="h-5 w-5 text-orange-500" />
                    <h3 className="font-semibold text-orange-700 dark:text-orange-400">
                      {i18n.language === "ar" ? "شرائح الأسعار" : "Price Tiers"}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {i18n.language === "ar" 
                      ? "اطلب كمية أكبر واحصل على سعر أفضل!" 
                      : "Order more and get a better price!"}
                  </p>
                  <div className="space-y-2">
                    {priceTiers.map((tier, index) => {
                      const isActive = quantity >= tier.min_quantity && 
                        (index === priceTiers.length - 1 || quantity < priceTiers[index + 1].min_quantity);
                      return (
                        <div 
                          key={tier.id}
                          className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                            isActive 
                              ? "bg-orange-100 dark:bg-orange-900/50 border border-orange-300 dark:border-orange-700" 
                              : "bg-background/50"
                          }`}
                        >
                          <span className={`text-sm ${isActive ? "font-medium" : ""}`}>
                            {i18n.language === "ar" 
                              ? `${tier.min_quantity}+ ${product.unit}` 
                              : `${tier.min_quantity}+ ${product.unit}`}
                          </span>
                          <span className={`font-bold ${isActive ? "text-orange-600 dark:text-orange-400" : "text-primary"}`}>
                            {tier.price_per_unit} {t("common.sar")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Description */}
              {productDescription && (
                <div>
                  <h3 className="font-semibold mb-2">{t("products.description") || "الوصف"}</h3>
                  <p className="text-muted-foreground">{productDescription}</p>
                </div>
              )}

              {/* Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{t("products.countryOfOrigin")}</span>
                  </div>
                  <p className="font-semibold">{product.country_of_origin || "غير محدد"}</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Scale className="h-4 w-4" />
                    <span className="text-sm">{t("products.unit")}</span>
                  </div>
                  <p className="font-semibold">{product.unit}</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Package className="h-4 w-4" />
                    <span className="text-sm">{t("products.stockQuantity") || "الكمية المتوفرة"}</span>
                  </div>
                  <p className="font-semibold">{product.stock_quantity || 0} {product.unit}</p>
                </div>
              </div>

              {/* Add to Cart */}
              <div className="bg-card rounded-xl border border-border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t("cart.quantity") || "الكمية"}</span>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-lg">
                  <span className="font-medium">{t("cart.total")}</span>
                  <span className="font-bold text-primary">{(displayPrice * quantity).toFixed(2)} {t("common.sar")}</span>
                </div>

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={!product.in_stock}
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {t("products.addToCart")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetails;

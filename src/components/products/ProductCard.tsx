import { memo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, MapPin, Heart, Tag, Layers } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import type { Product } from "@/hooks/useProducts";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useProductTranslation } from "@/hooks/useProductTranslation";
import { useFavoriteProducts, useToggleFavoriteProduct } from "@/hooks/useFavorites";
import { useHasFeature } from "@/hooks/useRestaurantAccess";

interface ProductCardProps {
  product: Product;
  index?: number;
  customPrice?: number | null;
  hasPriceTiers?: boolean;
}

const ProductCard = memo(({ product, index = 0, customPrice, hasPriceTiers = false }: ProductCardProps) => {
  const { addItem } = useCart();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { getProductName } = useProductTranslation();
  const { data: favoriteProducts = [] } = useFavoriteProducts();
  const toggleFavorite = useToggleFavoriteProduct();
  const { hasFeature: canUseFavorites } = useHasFeature("can_use_favorites");
  const { hasFeature: canOrder } = useHasFeature("can_order");
  
  const isFavorite = favoriteProducts.includes(product.id);
  const hasCustomPrice = customPrice !== null && customPrice !== undefined && customPrice !== product.price;
  const displayPrice = hasCustomPrice ? customPrice : product.price;
  // Price tiers only show if no custom price (custom price takes priority)
  const showPriceTiers = hasPriceTiers && !hasCustomPrice;
  
  const handleToggleFavorite = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      navigate("/login");
      return;
    }
    if (userRole !== "restaurant") {
      toast.error("فقط المطاعم يمكنها إضافة للمفضلة");
      return;
    }
    toggleFavorite.mutate({ productId: product.id, isFavorite });
  }, [user, userRole, navigate, toggleFavorite, product.id, isFavorite]);

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error(t("auth.loginRequired") || "يجب تسجيل الدخول أولاً");
      navigate("/login");
      return;
    }
    
    if (userRole !== "restaurant") {
      toast.error("فقط المطاعم يمكنها إضافة منتجات للسلة");
      return;
    }
    
    // إضافة المنتج بالسعر المخصص إن وجد
    const productWithCustomPrice = hasCustomPrice 
      ? { ...product, price: customPrice! }
      : product;
    
    addItem(productWithCustomPrice, 1);
    toast.success(`تم إضافة ${getProductName(product)} للسلة`);
  }, [user, userRole, navigate, t, hasCustomPrice, customPrice, product, addItem, getProductName]);

  const productName = getProductName(product);

  return (
    <Link to={`/products/${product.id}`}>
      <div
        className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-card transition-all duration-300 animate-fade-in group cursor-pointer"
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        {/* Product Image */}
        <div className="aspect-[4/3] bg-white flex items-center justify-center overflow-hidden relative p-2">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={productName}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <Package className="h-12 w-12 text-muted-foreground" />
          )}
          {/* Favorite Button - Only show if feature is enabled */}
          {userRole === "restaurant" && canUseFavorites && (
            <button
              onClick={handleToggleFavorite}
              className="absolute top-2 left-2 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
            >
              <Heart
                className={`h-5 w-5 transition-colors ${
                  isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
                }`}
              />
            </button>
          )}
          {/* Custom Price Badge */}
          {hasCustomPrice && (
            <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-green-500 text-white text-xs font-medium flex items-center gap-1">
              <Tag className="h-3 w-3" />
              سعر خاص
            </div>
          )}
          {/* Price Tiers Badge */}
          {showPriceTiers && (
            <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-orange-500 text-white text-xs font-medium flex items-center gap-1">
              <Layers className="h-3 w-3" />
              {i18n.language === "ar" ? "شرائح أسعار" : "Price Tiers"}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-lg truncate">{productName}</h3>
              <div className="flex items-center gap-2 mt-1">
                {product.supplier_profile?.avatar_url ? (
                  <img 
                    src={product.supplier_profile.avatar_url} 
                    alt={product.supplier_profile?.business_name || ""} 
                    className="w-5 h-5 rounded-full object-cover shrink-0"
                    loading="lazy"
                  />
                ) : null}
                <p className="text-sm text-muted-foreground truncate">
                  {product.supplier_profile?.business_name || t("products.supplier")}
                </p>
              </div>
              {product.supplier_profile?.region && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3" />
                  {product.supplier_profile.region}
                </p>
              )}
            </div>
            <Badge variant={product.in_stock ? "default" : "secondary"} className="shrink-0 ltr:ml-2 rtl:mr-2">
              {product.in_stock ? t("products.inStock") : t("products.outOfStock")}
            </Badge>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div>
              <span className="text-xl font-bold text-primary">{displayPrice}</span>
              <span className="text-sm text-muted-foreground ltr:ml-1 rtl:mr-1">{t("common.sar")}/{product.unit}</span>
              {hasCustomPrice && (
                <span className="block text-xs text-muted-foreground line-through">
                  {product.price} {t("common.sar")}
                </span>
              )}
            </div>
            {/* Hide add to cart button if ordering is disabled */}
            {(!userRole || userRole !== "restaurant" || canOrder) && (
              <Button size="sm" disabled={!product.in_stock} onClick={handleAddToCart}>
                <Plus className="h-4 w-4" />
                {t("products.addToCart")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;

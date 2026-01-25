import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, MapPin } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import type { Product } from "@/hooks/useProducts";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useProductTranslation } from "@/hooks/useProductTranslation";

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const { addItem } = useCart();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { getProductName } = useProductTranslation();

  const handleAddToCart = (e: React.MouseEvent) => {
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
    
    addItem(product, 1);
    toast.success(`تم إضافة ${getProductName(product)} للسلة`);
  };

  const productName = getProductName(product);

  return (
    <Link to={`/products/${product.id}`}>
      <div
        className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-card transition-all duration-300 animate-fade-in group cursor-pointer"
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        {/* Product Image */}
        <div className="h-40 bg-muted flex items-center justify-center overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={productName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <Package className="h-16 w-16 text-muted-foreground" />
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-lg truncate">{productName}</h3>
              <p className="text-sm text-muted-foreground truncate">
                {product.supplier_profile?.business_name || t("products.supplier")}
              </p>
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
              <span className="text-xl font-bold text-primary">{product.price}</span>
              <span className="text-sm text-muted-foreground ltr:ml-1 rtl:mr-1">{t("common.sar")}/{product.unit}</span>
            </div>
            <Button size="sm" disabled={!product.in_stock} onClick={handleAddToCart}>
              <Plus className="h-4 w-4" />
              {t("products.addToCart")}
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;

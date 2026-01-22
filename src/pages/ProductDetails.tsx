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
import { ArrowRight, Minus, Plus, ShoppingCart, Package, MapPin, Scale, Store } from "lucide-react";
import { toast } from "sonner";

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { getProductName, getProductDescription } = useProductTranslation();
  const { data: product, isLoading, error } = useProduct(id || "");
  const { addItem } = useCart();
  const { user, userRole } = useAuth();
  const [quantity, setQuantity] = useState(1);

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
      addItem(product, quantity);
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
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
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
                <span className="text-3xl font-bold text-primary">{product.price}</span>
                <span className="text-lg text-muted-foreground ltr:ml-2 rtl:mr-2">{t("common.sar")} / {product.unit}</span>
              </div>

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
                  <span className="font-bold text-primary">{(product.price * quantity).toFixed(2)} {t("common.sar")}</span>
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

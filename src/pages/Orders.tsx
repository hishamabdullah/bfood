import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useRestaurantOrders } from "@/hooks/useRestaurantOrders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Package, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import CollapsibleOrderCard from "@/components/orders/CollapsibleOrderCard";
import OrderSkeleton from "@/components/orders/OrderSkeleton";

const Orders = () => {
  const { t } = useTranslation();
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: orders, isLoading, error, refetch, isFetching } = useRestaurantOrders();
  const { addItem, clearCart } = useCart();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
    if (!authLoading && userRole && userRole !== "restaurant" && userRole !== "admin") {
      navigate("/dashboard");
    }
  }, [user, userRole, authLoading, navigate]);

  const handleRepeatOrder = useCallback((order: any) => {
    clearCart();
    
    order.order_items?.forEach((item: any) => {
      if (item.product) {
        addItem({
          id: item.product.id,
          name: item.product.name,
          price: item.unit_price,
          unit: item.product.unit,
          image_url: item.product.image_url,
          supplier_id: item.supplier_id,
          delivery_fee: item.product.delivery_fee || 0,
          in_stock: true,
          created_at: "",
          updated_at: "",
          category_id: null,
          subcategory_id: null,
          section_id: null,
          country_of_origin: null,
          description: null,
          stock_quantity: null,
          unlimited_stock: null,
          supplier_profile: item.supplier_profile || null,
          name_en: null,
          name_ur: null,
          name_hi: null,
          description_en: null,
          description_ur: null,
          description_hi: null,
          sku: null,
        }, item.quantity);
      }
    });
    
    toast.success(t("orders.addedToCart"));
    navigate("/cart");
  }, [clearCart, addItem, t, navigate]);

  // Show skeleton while loading
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1">
          <div className="container py-8">
            <div className="flex items-center gap-3 mb-6">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <div className="h-7 w-32 bg-muted rounded animate-pulse" />
                <div className="h-4 w-24 bg-muted rounded animate-pulse mt-1" />
              </div>
            </div>
            <OrderSkeleton count={4} />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1">
          <div className="container py-8">
            <Card>
              <CardHeader>
                <CardTitle>{t("common.error", "حدث خطأ")}</CardTitle>
                <CardDescription>
                  {t("orders.fetchError", "تعذر جلب الطلبات. جرّب مرة أخرى.")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="hero"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="gap-2"
                >
                  {isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t("common.retry", "إعادة المحاولة")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          <div className="flex items-center gap-3 mb-6">
            <Package className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">{t("orders.title")}</h1>
              <p className="text-sm text-muted-foreground">
                {orders?.length || 0} {t("supplier.ordersCount")}
              </p>
            </div>
          </div>

          {orders && orders.length > 0 ? (
            <div className="space-y-3">
              {orders.map((order) => (
                <CollapsibleOrderCard
                  key={order.id}
                  order={order}
                  onRepeatOrder={handleRepeatOrder}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-card rounded-2xl border">
              <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("orders.noOrders")}</h3>
              <p className="text-muted-foreground mb-4">
                {t("orders.startOrdering")}
              </p>
              <Button variant="hero" onClick={() => navigate("/products")}>
                {t("nav.products")}
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Orders;

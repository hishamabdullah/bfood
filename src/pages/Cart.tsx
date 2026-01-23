import { useState } from "react";
import { useTranslation } from "react-i18next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Package } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useCreateOrder } from "@/hooks/useOrders";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useProductTranslation } from "@/hooks/useProductTranslation";

const Cart = () => {
  const { t } = useTranslation();
  const { getProductName } = useProductTranslation();
  const { items, updateQuantity, removeItem, clearCart, getSubtotal, getItemsBySupplier } = useCart();
  const { user, userRole } = useAuth();
  const createOrder = useCreateOrder();
  const navigate = useNavigate();
  
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");

  const subtotal = getSubtotal();
  const groupedBySupplier = getItemsBySupplier();
  
  const deliveryFee = items.reduce((total, item) => {
    const productDeliveryFee = item.product.delivery_fee || 0;
    return total + productDeliveryFee;
  }, 0);
  const total = subtotal + deliveryFee;

  const handleCheckout = async () => {
    if (!user) {
      toast.error(t("cart.loginRequired") || "يجب تسجيل الدخول أولاً");
      navigate("/login");
      return;
    }

    if (userRole !== "restaurant") {
      toast.error(t("cart.restaurantOnly") || "فقط المطاعم يمكنها إنشاء طلبات");
      return;
    }

    if (items.length === 0) {
      toast.error(t("cart.empty"));
      return;
    }

    try {
      await createOrder.mutateAsync({
        items,
        deliveryAddress: deliveryAddress || undefined,
        notes: notes || undefined,
      });
      
      clearCart();
      toast.success(t("cart.orderSuccess") || "تم إنشاء الطلب بنجاح!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(t("cart.orderError") || "حدث خطأ أثناء إنشاء الطلب");
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{t("cart.empty")}</h2>
            <p className="text-muted-foreground mb-6">{t("cart.emptyMessage")}</p>
            <Link to="/products">
              <Button variant="hero">
                {t("cart.browseProducts")}
                <ArrowLeft className="h-5 w-5" />
              </Button>
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
          <h1 className="text-3xl font-bold mb-8">{t("cart.title")}</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {Object.entries(groupedBySupplier).map(([supplier, supplierItems]) => (
                <div key={supplier} className="bg-card rounded-2xl border border-border overflow-hidden">
                  {/* Supplier Header */}
                  <div className="bg-muted/50 px-6 py-3 border-b border-border">
                    <h3 className="font-semibold">{supplier}</h3>
                  </div>

                  {/* Items */}
                  <div className="divide-y divide-border">
                    {supplierItems.map((item) => (
                      <div key={item.id} className="p-4 flex gap-4">
                        {/* Image */}
                        <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                          {item.product.image_url ? (
                            <img 
                              src={item.product.image_url} 
                              alt={getProductName(item.product)}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <Link to={`/products/${item.product.id}`}>
                            <h4 className="font-semibold mb-1 hover:text-primary transition-colors">
                              {getProductName(item.product)}
                            </h4>
                          </Link>
                          <p className="text-sm text-muted-foreground mb-2">
                            {item.product.price} {t("common.sar")} / {item.product.unit}
                          </p>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-12 text-center font-medium">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Price & Remove */}
                        <div className="text-left">
                          <p className="font-bold text-lg text-primary">
                            {(item.product.price * item.quantity).toFixed(2)} {t("common.sar")}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive mt-2"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-2xl border border-border p-6 sticky top-24 space-y-6">
                <h3 className="font-bold text-xl">{t("cart.orderSummary")}</h3>

                {/* Delivery Address / Google Maps */}
                <div>
                  <label className="block text-sm font-medium mb-2">{t("cart.deliveryAddress")}</label>
                  <Input
                    placeholder={t("cart.deliveryAddress")}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium mb-2">{t("cart.notes")}</label>
                  <Textarea
                    placeholder={t("cart.notesPlaceholder")}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("cart.subtotal")}</span>
                    <span>{subtotal.toFixed(2)} {t("common.sar")}</span>
                  </div>
                  {deliveryFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("cart.deliveryFee")}</span>
                      <span>{deliveryFee.toFixed(2)} {t("common.sar")}</span>
                    </div>
                  )}
                  <div className="border-t border-border pt-4 flex justify-between">
                    <span className="font-bold">{t("cart.total")}</span>
                    <span className="font-bold text-xl text-primary">{total.toFixed(2)} {t("common.sar")}</span>
                  </div>
                </div>

                <Button 
                  variant="hero" 
                  className="w-full" 
                  size="lg"
                  onClick={handleCheckout}
                  disabled={createOrder.isPending}
                >
                  {createOrder.isPending ? t("cart.processingOrder") : t("cart.checkout")}
                  <ArrowLeft className="h-5 w-5" />
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  {t("cart.orderSplitNote")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Cart;

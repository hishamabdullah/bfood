import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useRestaurantOrders } from "@/hooks/useRestaurantOrders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle,
  Truck,
  CalendarDays,
  RotateCcw,
  User,
  Store,
  MapPin,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

// Group order items by supplier with status and delivery fee
const groupItemsBySupplier = (orderItems: any[]) => {
  const grouped: Record<string, { 
    supplier: any; 
    items: any[]; 
    status: string;
    deliveryFee: number;
    subtotal: number;
  }> = {};
  
  orderItems?.forEach((item) => {
    const supplierId = item.supplier_id;
    
    if (!grouped[supplierId]) {
      grouped[supplierId] = {
        supplier: item.supplier_profile,
        items: [],
        status: item.status || "pending",
        deliveryFee: 0,
        subtotal: 0,
      };
    }
    grouped[supplierId].items.push(item);
    grouped[supplierId].deliveryFee += item.delivery_fee || 0;
    grouped[supplierId].subtotal += item.unit_price * item.quantity;
    // Use the latest status from items
    if (item.status) {
      grouped[supplierId].status = item.status;
    }
  });
  
  return Object.values(grouped);
};

const Orders = () => {
  const { t, i18n } = useTranslation();
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: orders, isLoading } = useRestaurantOrders();
  const { addItem, clearCart } = useCart();

  const currentLocale = i18n.language === "ar" ? ar : enUS;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return { label: t("orders.pending"), variant: "secondary" as const, icon: Clock };
      case "confirmed":
        return { label: t("orders.confirmed"), variant: "default" as const, icon: CheckCircle };
      case "processing":
      case "preparing":
        return { label: t("orders.preparing"), variant: "default" as const, icon: Package };
      case "shipped":
        return { label: t("orders.shipped"), variant: "default" as const, icon: Truck };
      case "delivered":
        return { label: t("orders.delivered"), variant: "default" as const, icon: CheckCircle };
      case "cancelled":
        return { label: t("orders.cancelled"), variant: "destructive" as const, icon: XCircle };
      default:
        return { label: status, variant: "secondary" as const, icon: Clock };
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
    if (!authLoading && userRole && userRole !== "restaurant" && userRole !== "admin") {
      navigate("/dashboard");
    }
  }, [user, userRole, authLoading, navigate]);

  const handleRepeatOrder = (order: any) => {
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
        }, item.quantity);
      }
    });
    
    toast.success(t("orders.addedToCart"));
    navigate("/cart");
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          <div className="flex items-center gap-3 mb-8">
            <Package className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">{t("orders.title")}</h1>
          </div>

          {orders && orders.length > 0 ? (
            <div className="space-y-6">
              {orders.map((order) => {
                const groupedItems = groupItemsBySupplier(order.order_items);
                
                return (
                  <Card key={order.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/50">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <CardTitle className="text-lg">
                            {t("orders.orderNumber")} #{order.id.slice(0, 8)}
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CalendarDays className="h-4 w-4" />
                            {format(new Date(order.created_at), "PPP", { locale: currentLocale })}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRepeatOrder(order)}
                            className="gap-2"
                          >
                            <RotateCcw className="h-4 w-4" />
                            {t("orders.repeatOrder")}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-6">
                        {/* Grouped by Supplier - Each with separate status */}
                        {groupedItems.map((group, index) => {
                          const statusConfig = getStatusConfig(group.status);
                          const StatusIcon = statusConfig.icon;
                          const supplierTotal = group.subtotal + group.deliveryFee;
                          
                          return (
                            <div key={index} className="border rounded-xl overflow-hidden">
                              {/* Supplier Header with Status */}
                              <div className="bg-muted/30 px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Store className="h-4 w-4 text-primary" />
                                  <span className="font-semibold">
                                    {group.supplier?.business_name || t("orders.unknownSupplier")}
                                  </span>
                                  <Badge variant="outline" className="gap-1 ms-2">
                                    <Package className="h-3 w-3" />
                                    {group.items.reduce((total, item) => total + item.quantity, 0)} {t("orders.product")}
                                  </Badge>
                                  <Badge variant={statusConfig.variant} className="gap-1">
                                    <StatusIcon className="h-3 w-3" />
                                    {statusConfig.label}
                                  </Badge>
                                </div>
                                {group.supplier?.user_id && (
                                  <Link to={`/profile/${group.supplier.user_id}`}>
                                    <Button variant="ghost" size="sm" className="gap-1 text-xs">
                                      <User className="h-3 w-3" />
                                      {t("orders.viewProfile")}
                                    </Button>
                                  </Link>
                                )}
                              </div>
                              
                              {/* Items */}
                              <div className="divide-y">
                                {group.items.map((item: any) => {
                                  return (
                                    <div key={item.id} className="flex items-center justify-between p-4">
                                      <div className="flex items-center gap-3">
                                        {item.product?.image_url ? (
                                          <img 
                                            src={item.product.image_url} 
                                            alt={item.product?.name}
                                            className="w-12 h-12 rounded-lg object-cover"
                                          />
                                        ) : (
                                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                                            <Package className="h-5 w-5 text-muted-foreground" />
                                          </div>
                                        )}
                                        <div>
                                          <p className="font-medium">{item.product?.name || t("orders.deletedProduct")}</p>
                                          <p className="text-sm text-muted-foreground">
                                            {item.quantity} × {item.unit_price} {t("common.sar")}
                                          </p>
                                        </div>
                                      </div>
                                      <p className="font-medium">
                                        {(item.quantity * item.unit_price).toFixed(2)} {t("common.sar")}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Supplier Footer with Delivery Fee */}
                              <div className="bg-muted/20 px-4 py-3 border-t space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground flex items-center gap-1">
                                    <Truck className="h-3 w-3" />
                                    {t("orders.deliveryFee")}
                                  </span>
                                  <span className={group.deliveryFee > 0 ? "text-amber-600" : ""}>
                                    {group.deliveryFee.toFixed(2)} {t("common.sar")}
                                  </span>
                                </div>
                                <div className="flex justify-between font-semibold pt-1 border-t border-border">
                                  <span>{t("orders.supplierTotal")}</span>
                                  <span className="text-primary">{supplierTotal.toFixed(2)} {t("common.sar")}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Order Details */}
                        <div className="border-t pt-4 space-y-2">
                          {/* Branch Info */}
                          {order.branch && (
                            <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 mb-3">
                              <p className="text-sm font-medium mb-1 flex items-center gap-1">
                                <MapPin className="h-4 w-4 text-primary" />
                                {t("orders.branch")}: {order.branch.name}
                              </p>
                              {order.branch.address && (
                                <p className="text-sm text-muted-foreground ms-5">{order.branch.address}</p>
                              )}
                              {order.branch.google_maps_url && (
                                <a 
                                  href={order.branch.google_maps_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline flex items-center gap-1 ms-5 mt-1"
                                >
                                  {t("orders.openInMaps")}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          )}
                          
                          {order.delivery_address && !order.branch && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{t("orders.deliveryAddress")}:</span>
                              <span className="max-w-[300px] text-start truncate">
                                {order.delivery_address.startsWith("http") ? (
                                  <a 
                                    href={order.delivery_address} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    {t("orders.openInMaps")}
                                  </a>
                                ) : (
                                  order.delivery_address
                                )}
                              </span>
                            </div>
                          )}
                          {order.notes && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{t("orders.notes")}:</span>
                              <span>{order.notes}</span>
                            </div>
                          )}
                          
                          {/* رسوم التوصيل مفصلة لكل مورد */}
                          {groupedItems.filter(g => g.deliveryFee > 0).length > 0 && (
                            <div className="space-y-1 pt-2 border-t">
                              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                <Truck className="h-4 w-4" />
                                {t("orders.deliveryFee")}:
                              </p>
                              {groupedItems.filter(g => g.deliveryFee > 0).map((group, idx) => (
                                <div key={idx} className="flex justify-between text-sm ms-5">
                                  <span className="text-muted-foreground">{group.supplier?.business_name}</span>
                                  <span className="text-amber-600">{group.deliveryFee.toFixed(2)} {t("common.sar")}</span>
                                </div>
                              ))}
                              {groupedItems.filter(g => g.deliveryFee > 0).length > 1 && (
                                <div className="flex justify-between text-sm ms-5 font-medium pt-1 border-t border-dashed">
                                  <span className="text-muted-foreground">{t("orders.totalDeliveryFees")}</span>
                                  <span className="text-amber-600">{Number(order.delivery_fee).toFixed(2)} {t("common.sar")}</span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="flex justify-between font-bold text-lg border-t pt-2">
                            <span>{t("orders.total")}:</span>
                            <span className="text-primary">{order.total_amount} {t("common.sar")}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-semibold mb-2">{t("orders.noOrders")}</h2>
              <p className="text-muted-foreground">
                {t("orders.noOrdersMessage")}
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Orders;

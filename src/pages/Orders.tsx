import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useRestaurantOrders } from "@/hooks/useRestaurantOrders";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle,
  Truck,
  CalendarDays
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const getStatusConfig = (status: string) => {
  switch (status) {
    case "pending":
      return { label: "قيد الانتظار", variant: "secondary" as const, icon: Clock };
    case "confirmed":
      return { label: "مؤكد", variant: "default" as const, icon: CheckCircle };
    case "processing":
      return { label: "قيد التجهيز", variant: "default" as const, icon: Package };
    case "shipped":
      return { label: "تم الشحن", variant: "default" as const, icon: Truck };
    case "delivered":
      return { label: "تم التوصيل", variant: "default" as const, icon: CheckCircle };
    case "cancelled":
      return { label: "ملغي", variant: "destructive" as const, icon: XCircle };
    default:
      return { label: status, variant: "secondary" as const, icon: Clock };
  }
};

const Orders = () => {
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: orders, isLoading } = useRestaurantOrders();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
    if (!authLoading && userRole && userRole !== "restaurant" && userRole !== "admin") {
      navigate("/dashboard");
    }
  }, [user, userRole, authLoading, navigate]);

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
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          <div className="flex items-center gap-3 mb-8">
            <Package className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">طلباتي</h1>
          </div>

          {orders && orders.length > 0 ? (
            <div className="space-y-6">
              {orders.map((order) => {
                const statusConfig = getStatusConfig(order.status);
                const StatusIcon = statusConfig.icon;
                
                return (
                  <Card key={order.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/50">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <CardTitle className="text-lg">
                            طلب #{order.id.slice(0, 8)}
                          </CardTitle>
                          <Badge variant={statusConfig.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CalendarDays className="h-4 w-4" />
                          {format(new Date(order.created_at), "PPP", { locale: ar })}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {/* Order Items */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm text-muted-foreground">المنتجات</h4>
                          <div className="divide-y">
                            {order.order_items?.map((item: any) => {
                              const itemStatusConfig = getStatusConfig(item.status);
                              return (
                                <div key={item.id} className="flex items-center justify-between py-3">
                                  <div className="flex items-center gap-3">
                                    {item.product?.image_url && (
                                      <img 
                                        src={item.product.image_url} 
                                        alt={item.product?.name}
                                        className="w-12 h-12 rounded-lg object-cover"
                                      />
                                    )}
                                    <div>
                                      <p className="font-medium">{item.product?.name || "منتج محذوف"}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {item.quantity} × {item.unit_price} ر.س
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-left">
                                    <Badge variant={itemStatusConfig.variant} className="text-xs">
                                      {itemStatusConfig.label}
                                    </Badge>
                                    <p className="text-sm font-medium mt-1">
                                      {(item.quantity * item.unit_price).toFixed(2)} ر.س
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Order Details */}
                        <div className="border-t pt-4 space-y-2">
                          {order.delivery_address && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">عنوان التوصيل:</span>
                              <span>{order.delivery_address}</span>
                            </div>
                          )}
                          {order.notes && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">ملاحظات:</span>
                              <span>{order.notes}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">رسوم التوصيل:</span>
                            <span>{order.delivery_fee} ر.س</span>
                          </div>
                          <div className="flex justify-between font-bold text-lg border-t pt-2">
                            <span>الإجمالي:</span>
                            <span className="text-primary">{order.total_amount} ر.س</span>
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
              <h2 className="text-xl font-semibold mb-2">لا توجد طلبات</h2>
              <p className="text-muted-foreground">
                لم تقم بإجراء أي طلبات بعد. ابدأ بتصفح المنتجات!
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

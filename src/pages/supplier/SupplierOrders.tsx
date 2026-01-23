import React, { useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShoppingBag,
  Loader2,
  ArrowRight,
  Package,
  Phone,
  MapPin,
  ExternalLink,
  User,
  CalendarDays,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
} from "lucide-react";
import { useSupplierOrders, useUpdateOrderStatus } from "@/hooks/useSupplierOrders";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  pending: "في الانتظار",
  confirmed: "مؤكد",
  preparing: "قيد التحضير",
  shipped: "تم الشحن",
  delivered: "تم التوصيل",
  cancelled: "ملغي",
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "pending":
      return Clock;
    case "confirmed":
    case "delivered":
      return CheckCircle;
    case "preparing":
      return Package;
    case "shipped":
      return Truck;
    case "cancelled":
      return XCircle;
    default:
      return Clock;
  }
};

// Group order items by order_id
interface GroupedOrder {
  orderId: string;
  restaurant: any;
  items: any[];
  createdAt: string;
  deliveryAddress?: string;
  notes?: string;
  status: string; // Overall status based on items
  branch?: any; // Branch info
}

export default function SupplierOrders() {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const { data: orderItems, isLoading } = useSupplierOrders();
  const updateStatus = useUpdateOrderStatus();

  // Group items by order
  const groupedOrders = useMemo(() => {
    if (!orderItems) return [];
    
    const grouped: Record<string, GroupedOrder> = {};
    
    orderItems.forEach((item) => {
      const orderId = item.order_id;
      
      if (!grouped[orderId]) {
        grouped[orderId] = {
          orderId,
          restaurant: item.order?.restaurant_profile,
          items: [],
          createdAt: item.created_at,
          deliveryAddress: item.order?.delivery_address || undefined,
          notes: item.order?.notes || undefined,
          status: item.status, // Initialize with first item status
          branch: item.order?.branch || undefined,
        };
      }
      grouped[orderId].items.push(item);
    });

    // Determine overall status (use most common or first item's status)
    Object.values(grouped).forEach((order) => {
      // Use the first item's status as the order status
      if (order.items.length > 0) {
        order.status = order.items[0].status;
      }
    });
    
    // Sort by created_at descending
    return Object.values(grouped).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [orderItems]);

  useEffect(() => {
    if (!loading && (!user || userRole !== "supplier")) {
      navigate("/dashboard");
    }
  }, [user, userRole, loading, navigate]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || userRole !== "supplier") {
    return null;
  }

  const handleOrderStatusChange = (orderId: string, status: string) => {
    updateStatus.mutate({ orderId, status });
  };

  // Calculate order total for supplier's items only
  const calculateOrderTotal = (items: any[]) => {
    return items.reduce((total, item) => total + item.unit_price * item.quantity, 0);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              to="/dashboard"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowRight className="h-4 w-4 ml-1" />
              العودة للوحة التحكم
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShoppingBag className="h-7 w-7 text-primary" />
              الطلبات الواردة
            </h1>
            <p className="text-muted-foreground">
              {groupedOrders.length} طلب
            </p>
          </div>

          {/* Orders */}
          {groupedOrders.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border">
              <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد طلبات</h3>
              <p className="text-muted-foreground">
                ستظهر الطلبات هنا عندما يطلب المطاعم منتجاتك
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedOrders.map((order) => (
                <Card key={order.orderId} className="overflow-hidden">
                  <CardHeader className="bg-muted/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <CardTitle className="text-lg">
                          طلب #{order.orderId.slice(0, 8)}
                        </CardTitle>
                        {/* Order Status Selector */}
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleOrderStatusChange(order.orderId, value)}
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue>
                              <Badge
                                variant="secondary"
                                className={`${statusColors[order.status]} gap-1`}
                              >
                                {React.createElement(getStatusIcon(order.status), { className: "h-3 w-3" })}
                                {statusLabels[order.status] || order.status}
                              </Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />
                        {format(new Date(order.createdAt), "PPP", { locale: ar })}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      {/* Restaurant Info */}
                      <div className="bg-muted/30 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">
                                {order.restaurant?.business_name || "مطعم غير معروف"}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {order.restaurant?.full_name}
                              </p>
                            </div>
                          </div>
                          {order.restaurant?.user_id && (
                            <Link to={`/profile/${order.restaurant.user_id}`}>
                              <Button variant="outline" size="sm" className="gap-1">
                                <User className="h-4 w-4" />
                                الملف الشخصي
                              </Button>
                            </Link>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {order.restaurant?.phone && (
                            <a 
                              href={`tel:${order.restaurant.phone}`}
                              className="flex items-center gap-2 p-3 bg-background rounded-lg hover:bg-muted transition-colors"
                            >
                              <Phone className="h-4 w-4 text-primary" />
                              <span className="text-primary">{order.restaurant.phone}</span>
                            </a>
                          )}
                          
                          {order.restaurant?.google_maps_url && (
                            <a 
                              href={order.restaurant.google_maps_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-3 bg-background rounded-lg hover:bg-muted transition-colors"
                            >
                              <MapPin className="h-4 w-4 text-primary" />
                              <span className="text-primary">فتح في قوقل ماب</span>
                              <ExternalLink className="h-3 w-3 mr-auto" />
                            </a>
                          )}
                        </div>

                        {/* Branch Info */}
                        {order.branch && (
                          <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                            <p className="text-sm font-medium mb-1 flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-primary" />
                              الفرع: {order.branch.name}
                            </p>
                            {order.branch.address && (
                              <p className="text-sm text-muted-foreground mr-5">{order.branch.address}</p>
                            )}
                            {order.branch.google_maps_url && (
                              <a 
                                href={order.branch.google_maps_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline flex items-center gap-1 mr-5 mt-1"
                              >
                                فتح موقع الفرع في قوقل ماب
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        )}

                        {order.deliveryAddress && !order.branch && (
                          <div className="mt-3 p-3 bg-background rounded-lg">
                            <p className="text-sm font-medium mb-1">عنوان التوصيل:</p>
                            {order.deliveryAddress.startsWith("http") ? (
                              <a 
                                href={order.deliveryAddress}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline flex items-center gap-1"
                              >
                                فتح رابط الموقع
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <p className="text-sm text-muted-foreground">{order.deliveryAddress}</p>
                            )}
                          </div>
                        )}

                        {order.notes && (
                          <div className="mt-3 p-3 bg-background rounded-lg">
                            <p className="text-sm font-medium mb-1">ملاحظات:</p>
                            <p className="text-sm text-muted-foreground">{order.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Order Items */}
                      <div className="border rounded-xl overflow-hidden">
                        <div className="bg-muted/30 px-4 py-2 border-b">
                          <h4 className="font-medium text-sm">المنتجات المطلوبة</h4>
                        </div>
                        <div className="divide-y">
                          {order.items.map((item) => {
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
                                    <p className="font-medium">{item.product?.name || "منتج"}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {item.quantity} × {item.unit_price} ر.س
                                    </p>
                                  </div>
                                </div>
                                <p className="font-medium">
                                  {(item.quantity * item.unit_price).toFixed(2)} ر.س
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Order Total */}
                      <div className="flex justify-between items-center pt-4 border-t">
                        <span className="font-bold text-lg">إجمالي الطلب:</span>
                        <span className="font-bold text-xl text-primary">
                          {calculateOrderTotal(order.items).toFixed(2)} ر.س
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
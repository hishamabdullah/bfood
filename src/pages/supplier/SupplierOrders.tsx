import React, { useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import { ar, enUS } from "date-fns/locale";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
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
  deliveryFee: number; // Supplier-specific delivery fee
}

export default function SupplierOrders() {
  const { t, i18n } = useTranslation();
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const { data: orderItems, isLoading } = useSupplierOrders();
  const updateStatus = useUpdateOrderStatus();

  const currentLocale = i18n.language === "ar" ? ar : enUS;

  const statusLabels: Record<string, string> = {
    pending: t("orders.pending"),
    confirmed: t("orders.confirmed"),
    preparing: t("orders.preparing"),
    shipped: t("orders.shipped"),
    delivered: t("orders.delivered"),
    cancelled: t("orders.cancelled"),
  };

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
          deliveryFee: 0,
        };
      }
      grouped[orderId].items.push(item);
      grouped[orderId].deliveryFee += item.delivery_fee || 0;
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
  const calculateOrderTotal = (items: any[], deliveryFee: number = 0) => {
    const itemsTotal = items.reduce((total, item) => total + item.unit_price * item.quantity, 0);
    return itemsTotal + deliveryFee;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              to="/dashboard"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowRight className="h-4 w-4 ms-1 rtl:rotate-180" />
              {t("supplier.backToDashboard")}
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShoppingBag className="h-7 w-7 text-primary" />
              {t("orders.incomingOrders")}
            </h1>
            <p className="text-muted-foreground">
              {groupedOrders.length} {t("supplier.ordersCount")}
            </p>
          </div>

          {/* Orders */}
          {groupedOrders.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border">
              <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("supplier.noOrders")}</h3>
              <p className="text-muted-foreground">
                {t("supplier.ordersWillAppear")}
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
                          {t("orders.orderNumber")} #{order.orderId.slice(0, 8)}
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
                        {format(new Date(order.createdAt), "PPP", { locale: currentLocale })}
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
                              <div className="flex items-center gap-2">
                                {order.restaurant?.customer_code && (
                                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">
                                    {order.restaurant.customer_code}
                                  </span>
                                )}
                                <h3 className="font-semibold">
                                  {order.restaurant?.business_name || t("supplier.unknownRestaurant")}
                                </h3>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {order.restaurant?.full_name}
                              </p>
                            </div>
                          </div>
                          {order.restaurant?.user_id && (
                            <Link to={`/profile/${order.restaurant.user_id}`}>
                              <Button variant="outline" size="sm" className="gap-1">
                                <User className="h-4 w-4" />
                                {t("orders.viewProfile")}
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
                              <span className="text-primary">{t("orders.openInMaps")}</span>
                              <ExternalLink className="h-3 w-3 ms-auto" />
                            </a>
                          )}
                        </div>

                        {/* Branch Info */}
                        {order.branch && (
                          <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
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
                                {t("supplier.openBranchLocation")}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        )}

                        {order.deliveryAddress && !order.branch && (
                          <div className="mt-3 p-3 bg-background rounded-lg">
                            <p className="text-sm font-medium mb-1">{t("orders.deliveryAddress")}:</p>
                            {order.deliveryAddress.startsWith("http") ? (
                              <a 
                                href={order.deliveryAddress}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline flex items-center gap-1"
                              >
                                {t("orders.openLocationLink")}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <p className="text-sm text-muted-foreground">{order.deliveryAddress}</p>
                            )}
                          </div>
                        )}

                        {order.notes && (
                          <div className="mt-3 p-3 bg-background rounded-lg">
                            <p className="text-sm font-medium mb-1">{t("orders.notes")}:</p>
                            <p className="text-sm text-muted-foreground">{order.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Order Items */}
                      <div className="border rounded-xl overflow-hidden">
                        <div className="bg-muted/30 px-4 py-2 border-b flex items-center justify-between">
                          <h4 className="font-medium text-sm">{t("supplier.requestedProducts")}</h4>
                          <Badge variant="outline" className="gap-1">
                            <Package className="h-3 w-3" />
                            {order.items.reduce((total, item) => total + item.quantity, 0)} {t("orders.product")}
                          </Badge>
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
                      </div>

                      {/* Order Total */}
                      <div className="pt-4 border-t space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">{t("supplier.productsTotal")}:</span>
                          <span>{(calculateOrderTotal(order.items, 0)).toFixed(2)} {t("common.sar")}</span>
                        </div>
                        {order.deliveryFee > 0 && (
                          <div className="flex justify-between items-center text-sm text-amber-600">
                            <span className="flex items-center gap-1">
                              <Truck className="h-4 w-4" />
                              {t("orders.deliveryFee")}:
                            </span>
                            <span>{order.deliveryFee.toFixed(2)} {t("common.sar")}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="font-bold text-lg">{t("supplier.orderTotal")}:</span>
                          <span className="font-bold text-xl text-primary">
                            {calculateOrderTotal(order.items, order.deliveryFee).toFixed(2)} {t("common.sar")}
                          </span>
                        </div>
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

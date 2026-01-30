import { useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ShoppingBag, Loader2, ArrowRight } from "lucide-react";
import { useSupplierOrders, useUpdateOrderStatus } from "@/hooks/useSupplierOrders";
import { useSupplierPayments } from "@/hooks/useOrderPayments";
import CollapsibleSupplierOrderCard from "@/components/orders/CollapsibleSupplierOrderCard";

// Group order items by order_id
interface GroupedOrder {
  orderId: string;
  restaurant: any;
  items: any[];
  createdAt: string;
  deliveryAddress?: string;
  notes?: string;
  status: string;
  branch?: any;
  deliveryFee: number;
  isPickup: boolean;
}

export default function SupplierOrders() {
  const { t } = useTranslation();
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const { data: orderItems, isLoading } = useSupplierOrders();
  const { data: payments } = useSupplierPayments();
  const updateStatus = useUpdateOrderStatus();

  // Helper function to get payment info for a restaurant
  const getPaymentForRestaurant = (restaurantId: string) => {
    return payments?.find(p => p.restaurant_id === restaurantId);
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
          status: item.status,
          branch: item.order?.branch || undefined,
          deliveryFee: 0,
          isPickup: (item.order as any)?.is_pickup || false,
        };
      }
      grouped[orderId].items.push(item);
      grouped[orderId].deliveryFee += item.delivery_fee || 0;
    });

    // Determine overall status (use most common or first item's status)
    Object.values(grouped).forEach((order) => {
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          {/* Header */}
          <div className="mb-6">
            <Link
              to="/dashboard"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowRight className="h-4 w-4 ms-1 rtl:rotate-180" />
              {t("supplier.backToDashboard")}
            </Link>
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-7 w-7 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">{t("orders.incomingOrders")}</h1>
                <p className="text-sm text-muted-foreground">
                  {groupedOrders.length} {t("supplier.ordersCount")}
                </p>
              </div>
            </div>
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
            <div className="space-y-3">
              {groupedOrders.map((order) => (
                <CollapsibleSupplierOrderCard
                  key={order.orderId}
                  order={order}
                  payment={getPaymentForRestaurant(order.restaurant?.user_id)}
                  onStatusChange={handleOrderStatusChange}
                  isUpdating={updateStatus.isPending}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

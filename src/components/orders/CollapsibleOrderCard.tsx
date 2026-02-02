import { useState, memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { ChevronLeft, ChevronDown, Package, Clock, CheckCircle, XCircle, Truck, Store, RotateCcw, MapPin, ExternalLink, User, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { PaymentDetailsDialog } from "@/components/cart/PaymentDetailsDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { userDataQueryOptions } from "@/lib/queryConfig";

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  delivery_fee?: number;
  status?: string;
  supplier_id: string;
  invoice_url?: string | null;
  supplier_profile?: {
    business_name?: string;
    user_id?: string;
    bank_name?: string | null;
    bank_account_name?: string | null;
    bank_iban?: string | null;
  } | null;
  product?: {
    id: string;
    name: string;
    image_url?: string;
    unit?: string;
    delivery_fee?: number;
  } | null;
}

interface Branch {
  name: string;
  address?: string;
  google_maps_url?: string;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  delivery_fee: number;
  delivery_address?: string;
  notes?: string;
  branch?: Branch | null;
  order_items?: OrderItem[];
}

interface SupplierGroup {
  supplier: {
    business_name?: string;
    user_id?: string;
    bank_name?: string | null;
    bank_account_name?: string | null;
    bank_iban?: string | null;
  } | null;
  items: OrderItem[];
  status: string;
  deliveryFee: number;
  subtotal: number;
}

interface OrderPayment {
  id: string;
  order_id: string;
  supplier_id: string;
  is_paid: boolean;
  receipt_url: string | null;
}

interface CollapsibleOrderCardProps {
  order: Order;
  onRepeatOrder?: (order: Order) => void;
}

const groupItemsBySupplier = (orderItems: OrderItem[]): SupplierGroup[] => {
  const grouped: Record<string, SupplierGroup> = {};
  
  orderItems?.forEach((item) => {
    const supplierId = item.supplier_id;
    
    if (!grouped[supplierId]) {
      grouped[supplierId] = {
        supplier: item.supplier_profile || null,
        items: [],
        status: item.status || "pending",
        deliveryFee: 0,
        subtotal: 0,
      };
    }
    grouped[supplierId].items.push(item);
    grouped[supplierId].deliveryFee += item.delivery_fee || 0;
    grouped[supplierId].subtotal += item.unit_price * item.quantity;
    if (item.status) {
      grouped[supplierId].status = item.status;
    }
  });
  
  return Object.values(grouped);
};

const getStatusConfig = (status: string, t: (key: string) => string) => {
  switch (status) {
    case "pending":
      return { label: t("orders.pending"), variant: "secondary" as const, icon: Clock, color: "bg-yellow-100 text-yellow-800" };
    case "confirmed":
      return { label: t("orders.confirmed"), variant: "default" as const, icon: CheckCircle, color: "bg-blue-100 text-blue-800" };
    case "processing":
    case "preparing":
      return { label: t("orders.preparing"), variant: "default" as const, icon: Package, color: "bg-purple-100 text-purple-800" };
    case "shipped":
      return { label: t("orders.shipped"), variant: "default" as const, icon: Truck, color: "bg-indigo-100 text-indigo-800" };
    case "delivered":
      return { label: t("orders.delivered"), variant: "default" as const, icon: CheckCircle, color: "bg-green-100 text-green-800" };
    case "cancelled":
      return { label: t("orders.cancelled"), variant: "destructive" as const, icon: XCircle, color: "bg-red-100 text-red-800" };
    default:
      return { label: status, variant: "secondary" as const, icon: Clock, color: "bg-gray-100 text-gray-800" };
  }
};

const CollapsibleOrderCard = memo(({ order, onRepeatOrder }: CollapsibleOrderCardProps) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const currentLocale = i18n.language === "ar" ? ar : enUS;

  // Fetch payment details for this order - only when card is open
  const { data: payments } = useQuery({
    queryKey: ["order-payments", order.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_payments")
        .select("id, order_id, supplier_id, is_paid, receipt_url")
        .eq("order_id", order.id);
      if (error) throw error;
      return data as OrderPayment[];
    },
    enabled: !!order.id && isOpen, // Only fetch when card is open
    ...userDataQueryOptions,
  });

  const getPaymentForSupplier = (supplierId: string) => {
    return payments?.find(p => p.supplier_id === supplierId);
  };

  // Memoize grouped items to prevent unnecessary recalculation
  const groupedItems = useMemo(() => groupItemsBySupplier(order.order_items || []), [order.order_items]);

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="p-4">
          <div className="flex items-center justify-between gap-3">
            {/* Right side - Arrow and basic info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                  {isOpen ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm">#{order.id.slice(0, 8)}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(order.created_at), "dd/MM/yyyy", { locale: currentLocale })}
                  </span>
                </div>
                {/* عرض الموردين مع حالاتهم في سطر واحد */}
                <div className="flex items-center gap-3 flex-wrap">
                  {groupedItems.map((group, idx) => {
                    const supplierStatusConfig = getStatusConfig(group.status, t);
                    const SupplierStatusIcon = supplierStatusConfig.icon;
                    return (
                      <div key={idx} className="flex items-center gap-1.5">
                        <Store className="h-3 w-3 text-primary shrink-0" />
                        <span className="text-sm font-medium">
                          {group.supplier?.business_name || t("orders.unknownSupplier")}
                        </span>
                        <Badge className={`${supplierStatusConfig.color} gap-0.5 text-xs py-0 h-5`}>
                          <SupplierStatusIcon className="h-3 w-3" />
                          {supplierStatusConfig.label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Left side - Total */}
            <div className="text-left shrink-0">
              <p className="font-bold text-primary">{Number(order.total_amount).toFixed(2)} {t("common.sar")}</p>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 px-4">
            <div className="border-t pt-4 space-y-4">
              {/* Grouped by Supplier */}
              {groupedItems.map((group, index) => {
                const groupStatusConfig = getStatusConfig(group.status, t);
                const GroupStatusIcon = groupStatusConfig.icon;
                const supplierTotal = group.subtotal + group.deliveryFee;
                
                return (
                  <div key={index} className="border rounded-xl overflow-hidden">
                    {/* Supplier Header */}
                    <div className="bg-muted/30 px-3 py-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap flex-1">
                        <Store className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-semibold text-sm">
                          {group.supplier?.business_name || t("orders.unknownSupplier")}
                        </span>
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Package className="h-3 w-3" />
                          {group.items.reduce((total, item) => total + item.quantity, 0)}
                        </Badge>
                        <Badge className={`${groupStatusConfig.color} gap-1 text-xs`}>
                          <GroupStatusIcon className="h-3 w-3" />
                          {groupStatusConfig.label}
                        </Badge>
                      </div>
                      {/* Payment Details Button with check mark if notified */}
                      {(() => {
                        const payment = getPaymentForSupplier(group.items[0]?.supplier_id);
                        const hasNotified = payment?.is_paid;
                        return (
                          <div className="flex items-center gap-1">
                            {hasNotified && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                            <PaymentDetailsDialog
                              supplierId={group.items[0]?.supplier_id}
                              supplierName={group.supplier?.business_name || t("orders.unknownSupplier")}
                              supplierProfile={group.supplier}
                              amountToPay={supplierTotal}
                              orderId={order.id}
                              isConfirmed={group.status === "confirmed" || group.status === "preparing" || group.status === "shipped" || group.status === "delivered"}
                            />
                          </div>
                        );
                      })()}
                      {group.supplier?.user_id && (
                        <Link to={`/profile/${group.supplier.user_id}`}>
                          <Button variant="ghost" size="sm" className="gap-1 text-xs h-7">
                            <User className="h-3 w-3" />
                            {t("orders.viewProfile")}
                          </Button>
                        </Link>
                      )}
                    </div>
                    
                    {/* Items */}
                    <div className="divide-y">
                      {group.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-2">
                            {item.product?.image_url ? (
                              <img 
                                src={item.product.image_url} 
                                alt={item.product?.name}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                <Package className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-sm">{item.product?.name || t("orders.deletedProduct")}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.quantity} × {item.unit_price} {t("common.sar")}
                              </p>
                            </div>
                          </div>
                          <p className="font-medium text-sm">
                            {(item.quantity * item.unit_price).toFixed(2)} {t("common.sar")}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Supplier Footer */}
                    <div className="bg-muted/20 px-3 py-2 border-t space-y-1 text-sm">
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
                      {/* Invoice Link - show if any item has invoice_url */}
                      {(() => {
                        const invoiceUrl = group.items.find(item => item.invoice_url)?.invoice_url;
                        if (invoiceUrl) {
                          return (
                            <div className="flex justify-between items-center pt-1 border-t border-border">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {t("supplier.orderInvoice")}
                              </span>
                              <a
                                href={invoiceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-1 text-xs font-medium"
                              >
                                {t("supplier.viewInvoice")}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                );
              })}

              {/* Order Details */}
              <div className="space-y-2 pt-2">
                {order.branch && (
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
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
                    <span className="max-w-[200px] text-start truncate">
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
                    <span className="text-start max-w-[200px] truncate">{order.notes}</span>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between font-bold text-lg border-t pt-3 mt-3">
                  <span>{t("orders.total")}:</span>
                  <span className="text-primary">{Number(order.total_amount).toFixed(2)} {t("common.sar")}</span>
                </div>

                {/* Repeat Order Button */}
                {onRepeatOrder && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRepeatOrder(order)}
                    className="w-full gap-2 mt-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {t("orders.repeatOrder")}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
});

CollapsibleOrderCard.displayName = "CollapsibleOrderCard";

export default CollapsibleOrderCard;

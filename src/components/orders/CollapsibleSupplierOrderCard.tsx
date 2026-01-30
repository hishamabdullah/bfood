import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { 
  ChevronLeft, 
  ChevronDown, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  User,
  Phone,
  MapPin,
  ExternalLink,
  Warehouse,
  Banknote,
  Receipt,
  Image
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  delivery_fee?: number;
  status: string;
  product?: {
    id: string;
    name: string;
    image_url?: string;
  } | null;
}

interface Branch {
  name: string;
  address?: string;
  google_maps_url?: string;
}

interface Restaurant {
  business_name?: string;
  full_name?: string;
  phone?: string;
  google_maps_url?: string;
  user_id?: string;
  customer_code?: string;
}

interface Payment {
  is_paid: boolean;
  receipt_url?: string | null;
}

interface GroupedOrder {
  orderId: string;
  restaurant: Restaurant | null;
  items: OrderItem[];
  createdAt: string;
  deliveryAddress?: string;
  notes?: string;
  status: string;
  branch?: Branch;
  deliveryFee: number;
  isPickup: boolean;
}

interface CollapsibleSupplierOrderCardProps {
  order: GroupedOrder;
  payment?: Payment | null;
  onStatusChange: (orderId: string, status: string) => void;
  isUpdating?: boolean;
}

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

const CollapsibleSupplierOrderCard = ({ 
  order, 
  payment, 
  onStatusChange,
  isUpdating 
}: CollapsibleSupplierOrderCardProps) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const currentLocale = i18n.language === "ar" ? ar : enUS;

  const statusLabels: Record<string, string> = {
    pending: t("orders.pending"),
    confirmed: t("orders.confirmed"),
    preparing: t("orders.preparing"),
    shipped: t("orders.shipped"),
    delivered: t("orders.delivered"),
    cancelled: t("orders.cancelled"),
  };

  const StatusIcon = getStatusIcon(order.status);
  const itemsTotal = order.items.reduce((total, item) => total + item.unit_price * item.quantity, 0);
  const orderTotal = itemsTotal + order.deliveryFee;
  const itemsCount = order.items.reduce((total, item) => total + item.quantity, 0);

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
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm">#{order.orderId.slice(0, 8)}</span>
                  <Badge className={`${statusColors[order.status]} gap-1`}>
                    <StatusIcon className="h-3 w-3" />
                    {statusLabels[order.status] || order.status}
                  </Badge>
                  {order.isPickup && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <Warehouse className="h-3 w-3" />
                      {t("supplier.warehousePickup")}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <User className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    {order.restaurant?.customer_code && (
                      <span className="font-mono text-xs bg-muted px-1 rounded me-1">
                        {order.restaurant.customer_code}
                      </span>
                    )}
                    {order.restaurant?.business_name || t("supplier.unknownRestaurant")}
                  </span>
                </div>
              </div>
            </div>

            {/* Left side - Total, date, and payment status */}
            <div className="text-left shrink-0">
              <p className="font-bold text-primary">{orderTotal.toFixed(2)} {t("common.sar")}</p>
              <div className="flex items-center gap-1 justify-end">
                <p className="text-xs text-muted-foreground">
                  {format(new Date(order.createdAt), "dd/MM/yyyy", { locale: currentLocale })}
                </p>
                {payment?.is_paid ? (
                  <CheckCircle className="h-3 w-3 text-green-600" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 px-4">
            <div className="border-t pt-4 space-y-4">
              {/* Status Selector */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t("orders.orderStatus")}:</span>
                <Select
                  value={order.status}
                  onValueChange={(value) => onStatusChange(order.orderId, value)}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue>
                      <Badge className={`${statusColors[order.status]} gap-1`}>
                        {React.createElement(StatusIcon, { className: "h-3 w-3" })}
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

              {/* Restaurant Info */}
              <div className="bg-muted/30 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {order.restaurant?.customer_code && (
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">
                            {order.restaurant.customer_code}
                          </span>
                        )}
                        <h3 className="font-semibold text-sm">
                          {order.restaurant?.business_name || t("supplier.unknownRestaurant")}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {order.restaurant?.full_name}
                      </p>
                    </div>
                  </div>
                  {order.restaurant?.user_id && (
                    <Link to={`/profile/${order.restaurant.user_id}`}>
                      <Button variant="outline" size="sm" className="gap-1 text-xs h-7">
                        <User className="h-3 w-3" />
                        {t("orders.viewProfile")}
                      </Button>
                    </Link>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {order.restaurant?.phone && (
                    <a 
                      href={`tel:${order.restaurant.phone}`}
                      className="flex items-center gap-2 p-2 bg-background rounded-lg hover:bg-muted transition-colors text-sm"
                    >
                      <Phone className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-primary" dir="ltr">{order.restaurant.phone}</span>
                    </a>
                  )}
                  
                  {order.restaurant?.google_maps_url && (
                    <a 
                      href={order.restaurant.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 bg-background rounded-lg hover:bg-muted transition-colors text-sm"
                    >
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-primary">{t("orders.openInMaps")}</span>
                      <ExternalLink className="h-3 w-3 ms-auto shrink-0" />
                    </a>
                  )}
                </div>

                {/* Branch Info */}
                {order.branch && (
                  <div className="mt-2 p-2 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-sm font-medium mb-1 flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      {t("orders.branch")}: {order.branch.name}
                    </p>
                    {order.branch.address && (
                      <p className="text-xs text-muted-foreground ms-5">{order.branch.address}</p>
                    )}
                    {order.branch.google_maps_url && (
                      <a 
                        href={order.branch.google_maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1 ms-5 mt-1"
                      >
                        {t("supplier.openBranchLocation")}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}

                {order.deliveryAddress && !order.branch && (
                  <div className="mt-2 p-2 bg-background rounded-lg">
                    <p className="text-xs font-medium mb-1">{t("orders.deliveryAddress")}:</p>
                    {order.deliveryAddress.startsWith("http") ? (
                      <a 
                        href={order.deliveryAddress}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        {t("orders.openLocationLink")}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <p className="text-xs text-muted-foreground">{order.deliveryAddress}</p>
                    )}
                  </div>
                )}

                {order.notes && (
                  <div className="mt-2 p-2 bg-background rounded-lg">
                    <p className="text-xs font-medium mb-1">{t("orders.notes")}:</p>
                    <p className="text-xs text-muted-foreground">{order.notes}</p>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="border rounded-xl overflow-hidden">
                <div className="bg-muted/30 px-3 py-2 border-b flex items-center justify-between">
                  <h4 className="font-medium text-sm">{t("supplier.requestedProducts")}</h4>
                  <Badge variant="outline" className="gap-1">
                    <Package className="h-3 w-3" />
                    {itemsCount} {t("orders.product")}
                  </Badge>
                </div>
                <div className="divide-y">
                  {order.items.map((item) => (
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
              </div>

              {/* Order Total */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{t("supplier.productsTotal")}:</span>
                  <span>{itemsTotal.toFixed(2)} {t("common.sar")}</span>
                </div>
                
                {!order.isPickup && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Truck className="h-3 w-3" />
                      {t("orders.deliveryFee")}:
                    </span>
                    <span className={order.deliveryFee > 0 ? "text-amber-600" : ""}>
                      {order.deliveryFee.toFixed(2)} {t("common.sar")}
                    </span>
                  </div>
                )}
                
                {order.isPickup && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded-lg">
                    <Warehouse className="h-4 w-4 shrink-0" />
                    <span>{t("supplier.warehousePickup")}</span>
                  </div>
                )}

                <div className="flex justify-between font-bold text-lg border-t pt-3">
                  <span>{t("orders.total")}:</span>
                  <span className="text-primary">{orderTotal.toFixed(2)} {t("common.sar")}</span>
                </div>

                {/* Payment Status */}
                <div className={`p-3 rounded-lg border ${payment?.is_paid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Banknote className={`h-4 w-4 ${payment?.is_paid ? 'text-green-600' : 'text-red-600'}`} />
                      <span className={`text-sm font-medium ${payment?.is_paid ? 'text-green-800' : 'text-red-800'}`}>
                        {payment?.is_paid ? t("supplier.paymentReceived") : t("supplier.paymentPending")}
                      </span>
                    </div>
                    {payment?.receipt_url && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-1 text-xs"
                            onClick={() => setSelectedReceipt(payment.receipt_url || null)}
                          >
                            <Receipt className="h-3 w-3" />
                            {t("supplier.viewReceipt")}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{t("supplier.paymentReceipt")}</DialogTitle>
                          </DialogHeader>
                          <div className="flex items-center justify-center p-4">
                            {payment.receipt_url ? (
                              <img 
                                src={payment.receipt_url} 
                                alt={t("supplier.paymentReceipt")}
                                className="max-w-full max-h-[60vh] object-contain rounded-lg"
                              />
                            ) : (
                              <div className="text-center py-8">
                                <Image className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                                <p className="text-muted-foreground">{t("supplier.noReceiptImage")}</p>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default CollapsibleSupplierOrderCard;

import React, { useState, memo, useMemo, useCallback } from "react";
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
  Image,
  Printer
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
import { InvoiceUploadDialog } from "@/components/supplier/InvoiceUploadDialog";

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  delivery_fee?: number;
  status: string;
  invoice_url?: string | null;
  product?: {
    id: string;
    name: string;
    image_url?: string;
    unit?: string;
    sku?: string | null;
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

const CollapsibleSupplierOrderCard = memo(({ 
  order, 
  payment, 
  onStatusChange,
  isUpdating 
}: CollapsibleSupplierOrderCardProps) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const currentLocale = i18n.language === "ar" ? ar : enUS;

  const statusLabels: Record<string, string> = useMemo(() => ({
    pending: t("orders.pending"),
    confirmed: t("orders.confirmed"),
    preparing: t("orders.preparing"),
    shipped: t("orders.shipped"),
    delivered: t("orders.delivered"),
    cancelled: t("orders.cancelled"),
  }), [t]);

  const StatusIcon = getStatusIcon(order.status);
  
  // Memoize calculations
  const itemsTotal = useMemo(() => 
    order.items.reduce((total, item) => total + item.unit_price * item.quantity, 0), 
    [order.items]
  );
  const orderTotal = useMemo(() => itemsTotal + order.deliveryFee, [itemsTotal, order.deliveryFee]);
  const itemsCount = useMemo(() => 
    order.items.reduce((total, item) => total + item.quantity, 0), 
    [order.items]
  );

  const handleStatusChange = useCallback((value: string) => {
    onStatusChange(order.orderId, value);
  }, [onStatusChange, order.orderId]);

  const handlePrint = useCallback(() => {
    const printContent = `
      <!DOCTYPE html>
      <html dir="${i18n.language === 'ar' ? 'rtl' : 'ltr'}" lang="${i18n.language}">
      <head>
        <meta charset="UTF-8">
        <title>${t("supplier.orderDetails")} #${order.orderId.slice(0, 8)}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif; 
            padding: 20px; 
            max-width: 800px; 
            margin: 0 auto;
            direction: ${i18n.language === 'ar' ? 'rtl' : 'ltr'};
          }
          .header { 
            border-bottom: 2px solid #333; 
            padding-bottom: 15px; 
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .order-id { font-size: 24px; font-weight: bold; }
          .date { color: #666; font-size: 14px; }
          .status { 
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
          }
          .status-pending { background: #fef3c7; color: #92400e; }
          .status-confirmed { background: #dbeafe; color: #1e40af; }
          .status-preparing { background: #f3e8ff; color: #7c3aed; }
          .status-shipped { background: #e0e7ff; color: #4338ca; }
          .status-delivered { background: #dcfce7; color: #166534; }
          .status-cancelled { background: #fee2e2; color: #dc2626; }
          .section { margin-bottom: 20px; }
          .section-title { 
            font-size: 14px; 
            font-weight: bold; 
            color: #666;
            margin-bottom: 8px;
            border-bottom: 1px solid #eee;
            padding-bottom: 4px;
          }
          .customer-info { 
            background: #f9fafb; 
            padding: 12px; 
            border-radius: 8px;
          }
          .customer-info p { margin-bottom: 4px; }
          .products-table { 
            width: 100%; 
            border-collapse: collapse;
            margin-top: 10px;
          }
          .products-table th, .products-table td { 
            padding: 10px;
            text-align: ${i18n.language === 'ar' ? 'right' : 'left'};
            border-bottom: 1px solid #eee;
          }
          .products-table th { 
            background: #f3f4f6;
            font-weight: 600;
            font-size: 12px;
            color: #666;
          }
          .products-table .qty { 
            text-align: center;
            font-weight: bold;
            background: #f0f9ff;
            color: #0369a1;
          }
          .products-table .price { text-align: ${i18n.language === 'ar' ? 'left' : 'right'}; }
          .products-table .subtotal { 
            text-align: ${i18n.language === 'ar' ? 'left' : 'right'}; 
            font-weight: bold;
            color: #0369a1;
          }
          .totals { 
            margin-top: 20px;
            padding-top: 15px;
            border-top: 2px solid #333;
          }
          .totals-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 8px;
            font-size: 14px;
          }
          .totals-row.grand-total { 
            font-size: 18px; 
            font-weight: bold;
            color: #0369a1;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #eee;
          }
          .footer { 
            margin-top: 30px;
            text-align: center;
            color: #999;
            font-size: 12px;
          }
          .pickup-badge {
            display: inline-block;
            padding: 4px 8px;
            background: #f3f4f6;
            border-radius: 4px;
            font-size: 12px;
            margin-${i18n.language === 'ar' ? 'right' : 'left'}: 8px;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="order-id">${t("supplier.orderDetails")} #${order.orderId.slice(0, 8)}</div>
            <div class="date">${format(new Date(order.createdAt), "dd/MM/yyyy HH:mm", { locale: currentLocale })}</div>
          </div>
          <div>
            <span class="status status-${order.status}">${statusLabels[order.status] || order.status}</span>
            ${order.isPickup ? `<span class="pickup-badge">${t("supplier.warehousePickup")}</span>` : ''}
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">${t("supplier.customerInfo")}</div>
          <div class="customer-info">
            <p><strong>${order.restaurant?.business_name || t("supplier.unknownRestaurant")}</strong></p>
            ${order.restaurant?.customer_code ? `<p>${t("supplier.customerCode")}: ${order.restaurant.customer_code}</p>` : ''}
            ${order.restaurant?.full_name ? `<p>${order.restaurant.full_name}</p>` : ''}
            ${order.restaurant?.phone ? `<p>${t("profile.phone")}: ${order.restaurant.phone}</p>` : ''}
            ${order.branch ? `<p>${t("orders.branch")}: ${order.branch.name}${order.branch.address ? ` - ${order.branch.address}` : ''}</p>` : ''}
            ${order.deliveryAddress && !order.branch ? `<p>${t("orders.deliveryAddress")}: ${order.deliveryAddress}</p>` : ''}
            ${order.notes ? `<p>${t("orders.notes")}: ${order.notes}</p>` : ''}
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">${t("supplier.requestedProducts")}</div>
          <table class="products-table">
            <thead>
              <tr>
                <th>${t("supplier.tableProduct")}</th>
                <th style="text-align: center;">${t("orders.quantity")}</th>
                <th class="price">${t("orders.unitPrice")}</th>
                <th class="price">${t("orders.subtotal")}</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.product?.name || t("orders.deletedProduct")}</td>
                  <td class="qty">${item.quantity}</td>
                  <td class="price">${item.unit_price.toFixed(2)} ${t("common.sar")}</td>
                  <td class="subtotal">${(item.quantity * item.unit_price).toFixed(2)} ${t("common.sar")}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="totals">
          <div class="totals-row">
            <span>${t("supplier.productsTotal")}:</span>
            <span>${itemsTotal.toFixed(2)} ${t("common.sar")}</span>
          </div>
          ${!order.isPickup ? `
            <div class="totals-row">
              <span>${t("orders.deliveryFee")}:</span>
              <span>${order.deliveryFee.toFixed(2)} ${t("common.sar")}</span>
            </div>
          ` : `
            <div class="totals-row">
              <span>${t("supplier.warehousePickup")}</span>
              <span>-</span>
            </div>
          `}
          <div class="totals-row grand-total">
            <span>${t("orders.total")}:</span>
            <span>${orderTotal.toFixed(2)} ${t("common.sar")}</span>
          </div>
        </div>
        
        <div class="footer">
          ${t("supplier.printedOn")}: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: currentLocale })}
        </div>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  }, [order, itemsTotal, orderTotal, statusLabels, t, i18n.language, currentLocale]);

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
                  onValueChange={handleStatusChange}
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
                <div className="bg-muted/50 px-4 py-3 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{t("supplier.requestedProducts")}</h4>
                      <Badge variant="secondary" className="gap-1 px-3">
                        <Package className="h-3.5 w-3.5" />
                        {itemsCount} {t("orders.product")}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={handlePrint}
                    >
                      <Printer className="h-4 w-4" />
                      {t("supplier.printOrder")}
                    </Button>
                  </div>
                </div>
                
                {/* Table Header */}
                <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-4 py-2 bg-muted/30 text-xs font-semibold text-muted-foreground border-b">
                  <div className="col-span-4">{t("supplier.tableProduct")}</div>
                  <div className="col-span-2 text-center">{t("orders.quantity")}</div>
                  <div className="col-span-2 text-center">{t("supplier.tableUnit")}</div>
                  <div className="col-span-2 text-center">{t("orders.unitPrice")}</div>
                  <div className="col-span-2 text-end">{t("orders.subtotal")}</div>
                </div>
                
                <div className="divide-y">
                  {order.items.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-muted/20 transition-colors">
                      {/* Desktop Layout */}
                      <div className="hidden sm:grid sm:grid-cols-12 gap-2 items-center">
                        {/* Product */}
                        <div className="col-span-4 flex items-center gap-3">
                          {item.product?.image_url ? (
                            <img
                              src={item.product.image_url}
                              alt={item.product?.name}
                              className="w-12 h-12 rounded-lg object-cover border bg-white shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground line-clamp-2">
                              {item.product?.name || t("orders.deletedProduct")}
                            </p>
                            {item.product?.sku && (
                              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                SKU: {item.product.sku}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Quantity */}
                        <div className="col-span-2 text-center">
                          <span className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1.5 bg-primary/10 text-primary font-bold rounded-lg text-lg">
                            {item.quantity}
                          </span>
                        </div>
                        
                        {/* Unit */}
                        <div className="col-span-2 text-center">
                          <span className="inline-flex items-center justify-center px-2 py-1 bg-muted text-muted-foreground rounded text-sm font-medium">
                            {item.product?.unit ? t(`productForm.units.${item.product.unit}`) : "-"}
                          </span>
                        </div>
                        
                        {/* Unit Price */}
                        <div className="col-span-2 text-center">
                          <span className="text-muted-foreground">
                            {item.unit_price.toFixed(2)}
                          </span>
                          <span className="text-xs text-muted-foreground/70 ms-1">{t("common.sar")}</span>
                        </div>
                        
                        {/* Subtotal */}
                        <div className="col-span-2 text-end">
                          <span className="font-bold text-lg text-primary">
                            {(item.quantity * item.unit_price).toFixed(2)}
                          </span>
                          <span className="text-xs text-muted-foreground ms-1">{t("common.sar")}</span>
                        </div>
                      </div>
                      
                      {/* Mobile Layout */}
                      <div className="sm:hidden">
                        <div className="flex items-start gap-3">
                          {item.product?.image_url ? (
                            <img
                              src={item.product.image_url}
                              alt={item.product?.name}
                              className="w-14 h-14 rounded-lg object-cover border bg-white shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground mb-1">
                              {item.product?.name || t("orders.deletedProduct")}
                            </p>
                            {item.product?.sku && (
                              <p className="text-xs text-muted-foreground font-mono mb-2">
                                SKU: {item.product.sku}
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="inline-flex items-center justify-center px-3 py-1 bg-primary/10 text-primary font-bold rounded-lg">
                                  {item.quantity}×
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {item.unit_price.toFixed(2)} {t("common.sar")}
                                </span>
                              </div>
                              <span className="font-bold text-primary">
                                {(item.quantity * item.unit_price).toFixed(2)} {t("common.sar")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
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

                {/* Invoice Upload */}
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium">{t("supplier.orderInvoice")}:</span>
                  <InvoiceUploadDialog
                    orderId={order.orderId}
                    currentInvoiceUrl={order.items[0]?.invoice_url}
                  />
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
});

CollapsibleSupplierOrderCard.displayName = "CollapsibleSupplierOrderCard";

export default CollapsibleSupplierOrderCard;

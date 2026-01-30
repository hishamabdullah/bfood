import { useState } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Loader2, MapPin, Truck, ChevronDown, ChevronUp, ExternalLink, CheckCircle2, XCircle, Building2 } from "lucide-react";
import { useAdminDeliveryOrders, DeliveryOrder } from "@/hooks/useAdminDeliveryOrders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  preparing: "bg-blue-100 text-blue-800",
  ready: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  preparing: "جاري التحضير",
  ready: "جاهز للتسليم",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

const DeliveryOrderCard = ({ order }: { order: DeliveryOrder }) => {
  const [isOpen, setIsOpen] = useState(false);

  const totalDeliveryFee = order.suppliers.reduce((sum, s) => sum + s.delivery_fee, 0);
  const allPaid = order.suppliers.every(s => s.is_paid);
  const somePaid = order.suppliers.some(s => s.is_paid);

  return (
    <Card className="mb-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">
                  {order.restaurant_profile?.business_name || "مطعم غير معروف"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(order.created_at), "dd MMM yyyy - HH:mm", { locale: ar })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge className={statusColors[order.status] || "bg-gray-100"}>
                {statusLabels[order.status] || order.status}
              </Badge>
              
              {allPaid ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle2 className="h-3 w-3 ml-1" />
                  تم الدفع
                </Badge>
              ) : somePaid ? (
                <Badge className="bg-yellow-100 text-yellow-800">
                  دفع جزئي
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800">
                  <XCircle className="h-3 w-3 ml-1" />
                  لم يتم الدفع
                </Badge>
              )}
              
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          {/* ملخص سريع */}
          <div className="flex flex-wrap gap-4 mt-3 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{order.restaurant_profile?.region || "غير محدد"}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Truck className="h-4 w-4" />
              <span>{order.suppliers.length} مورد</span>
            </div>
            <div className="font-medium text-primary">
              رسوم التوصيل: {totalDeliveryFee.toFixed(2)} ر.س
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {/* معلومات المطعم */}
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                معلومات المطعم
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">الاسم:</span>{" "}
                  <span className="font-medium">{order.restaurant_profile?.business_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">المنطقة:</span>{" "}
                  <span className="font-medium">{order.restaurant_profile?.region || "غير محدد"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">الفرع:</span>{" "}
                  <span className="font-medium">{order.branch?.name || "الرئيسي"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">العنوان:</span>{" "}
                  <span className="font-medium">{order.branch?.address || order.delivery_address || "-"}</span>
                </div>
                {(order.branch?.google_maps_url || order.restaurant_profile?.google_maps_url) && (
                  <div className="md:col-span-2">
                    <a
                      href={order.branch?.google_maps_url || order.restaurant_profile?.google_maps_url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <MapPin className="h-4 w-4" />
                      عرض موقع المطعم على الخريطة
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* معلومات الموردين */}
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Truck className="h-4 w-4" />
              تفاصيل الموردين ({order.suppliers.length})
            </h4>
            
            <div className="space-y-3">
              {order.suppliers.map((supplier) => (
                <div
                  key={supplier.supplier_id}
                  className="border rounded-lg p-4 bg-background"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h5 className="font-medium text-lg">
                        {supplier.supplier_profile?.business_name || "مورد غير معروف"}
                      </h5>
                      <p className="text-sm text-muted-foreground">
                        {supplier.items_count} منتج • المنطقة: {supplier.supplier_profile?.region || "غير محدد"}
                      </p>
                    </div>
                    
                    <div className="text-left">
                      {supplier.is_paid ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3 w-3 ml-1" />
                          تم التحويل
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">
                          <XCircle className="h-3 w-3 ml-1" />
                          لم يتم التحويل
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="bg-muted/30 rounded p-2">
                      <p className="text-muted-foreground text-xs">قيمة المنتجات</p>
                      <p className="font-semibold">{supplier.items_total.toFixed(2)} ر.س</p>
                    </div>
                    <div className="bg-muted/30 rounded p-2">
                      <p className="text-muted-foreground text-xs">رسوم التوصيل</p>
                      <p className="font-semibold text-primary">{supplier.delivery_fee.toFixed(2)} ر.س</p>
                    </div>
                    <div className="bg-muted/30 rounded p-2">
                      <p className="text-muted-foreground text-xs">الإجمالي</p>
                      <p className="font-bold">{(supplier.items_total + supplier.delivery_fee).toFixed(2)} ر.س</p>
                    </div>
                    <div className="bg-muted/30 rounded p-2">
                      <p className="text-muted-foreground text-xs">منطقة المورد</p>
                      <p className="font-medium">{supplier.supplier_profile?.region || "-"}</p>
                    </div>
                  </div>

                  {supplier.supplier_profile?.google_maps_url && (
                    <div className="mt-3">
                      <a
                        href={supplier.supplier_profile.google_maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
                      >
                        <MapPin className="h-4 w-4" />
                        عرض موقع المورد على الخريطة
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  {supplier.receipt_url && (
                    <div className="mt-2">
                      <a
                        href={supplier.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:underline inline-flex items-center gap-1 text-sm"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        عرض إيصال التحويل
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* إجمالي الطلب */}
            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <span className="font-semibold">إجمالي الطلب الكلي:</span>
              <span className="text-xl font-bold text-primary">
                {(Number(order.total_amount) + Number(order.delivery_fee)).toFixed(2)} ر.س
              </span>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

const AdminDeliveryOrders = () => {
  const { data: orders, isLoading } = useAdminDeliveryOrders();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium">لا توجد طلبات توصيل</h3>
        <p className="text-muted-foreground">ستظهر هنا طلبات التوصيل التي تحتاج متابعة</p>
      </div>
    );
  }

  // إحصائيات سريعة
  const totalOrders = orders.length;
  const paidOrders = orders.filter(o => o.suppliers.every(s => s.is_paid)).length;
  const unpaidOrders = orders.filter(o => o.suppliers.every(s => !s.is_paid)).length;
  const partialPaidOrders = totalOrders - paidOrders - unpaidOrders;

  return (
    <div>
      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
          <p className="text-2xl font-bold">{totalOrders}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">تم الدفع</p>
          <p className="text-2xl font-bold text-green-600">{paidOrders}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">لم يتم الدفع</p>
          <p className="text-2xl font-bold text-red-600">{unpaidOrders}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">دفع جزئي</p>
          <p className="text-2xl font-bold text-yellow-600">{partialPaidOrders}</p>
        </Card>
      </div>

      {/* قائمة الطلبات */}
      {orders.map((order) => (
        <DeliveryOrderCard key={order.id} order={order} />
      ))}
    </div>
  );
};

export default AdminDeliveryOrders;

import { useState } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Loader2, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { useAdminOrders, AdminOrder } from "@/hooks/useAdminData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

const AdminOrdersTable = () => {
  const { data: orders, isLoading } = useAdminOrders();
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-semibold">جميع الطلبات ({orders?.length || 0})</h3>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">رقم الطلب</TableHead>
              <TableHead className="text-right">المطعم</TableHead>
              <TableHead className="text-right">الفرع</TableHead>
              <TableHead className="text-right">المبلغ</TableHead>
              <TableHead className="text-right">التوصيل</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">التاريخ</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders?.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-xs">
                  {order.id.slice(0, 8)}...
                </TableCell>
                <TableCell>{order.restaurant_profile?.business_name || "-"}</TableCell>
                <TableCell>{order.branch?.name || "-"}</TableCell>
                <TableCell>{Number(order.total_amount).toFixed(2)} ر.س</TableCell>
                <TableCell>{Number(order.delivery_fee).toFixed(2)} ر.س</TableCell>
                <TableCell>
                  <Badge className={statusColors[order.status] || "bg-gray-100"}>
                    {statusLabels[order.status] || order.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(new Date(order.created_at), "dd MMM yyyy", { locale: ar })}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* تفاصيل الطلب */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل الطلب</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">المطعم</p>
                  <p className="font-medium">{selectedOrder.restaurant_profile?.business_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الفرع</p>
                  <p className="font-medium">{selectedOrder.branch?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">العنوان</p>
                  <p className="font-medium">{selectedOrder.branch?.address || selectedOrder.delivery_address || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الملاحظات</p>
                  <p className="font-medium">{selectedOrder.notes || "-"}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">المنتجات</h4>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.product?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          المورد: {item.supplier_profile?.business_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          الكمية: {item.quantity} × {Number(item.unit_price).toFixed(2)} ر.س
                        </p>
                        {Number(item.delivery_fee) > 0 && (
                          <p className="text-sm text-orange-600">
                            رسوم التوصيل: {Number(item.delivery_fee).toFixed(2)} ر.س
                          </p>
                        )}
                      </div>
                      <div className="text-left">
                        <Badge className={statusColors[item.status] || "bg-gray-100"}>
                          {statusLabels[item.status] || item.status}
                        </Badge>
                        <p className="text-sm font-medium mt-1">
                          {(item.quantity * Number(item.unit_price) + Number(item.delivery_fee || 0)).toFixed(2)} ر.س
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 flex justify-between text-lg font-bold">
                <span>الإجمالي الكلي:</span>
                <span>{(Number(selectedOrder.total_amount) + Number(selectedOrder.delivery_fee)).toFixed(2)} ر.س</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrdersTable;

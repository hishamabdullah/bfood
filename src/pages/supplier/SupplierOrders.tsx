import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShoppingBag,
  Loader2,
  ArrowRight,
  Package,
  Phone,
  MapPin,
  ExternalLink,
  User,
} from "lucide-react";
import { useSupplierOrders, useUpdateOrderItemStatus } from "@/hooks/useSupplierOrders";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

export default function SupplierOrders() {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const { data: orderItems, isLoading } = useSupplierOrders();
  const updateStatus = useUpdateOrderItemStatus();

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

  const handleStatusChange = (itemId: string, status: string) => {
    updateStatus.mutate({ itemId, status });
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
              <ArrowRight className="h-4 w-4 ml-1" />
              العودة للوحة التحكم
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShoppingBag className="h-7 w-7 text-primary" />
              الطلبات الواردة
            </h1>
            <p className="text-muted-foreground">
              {orderItems?.length || 0} طلب
            </p>
          </div>

          {/* Orders Table */}
          {!orderItems?.length ? (
            <div className="text-center py-16 bg-card rounded-2xl border">
              <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد طلبات</h3>
              <p className="text-muted-foreground">
                ستظهر الطلبات هنا عندما يطلب المطاعم منتجاتك
              </p>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم الطلب</TableHead>
                    <TableHead className="text-right">المطعم</TableHead>
                    <TableHead className="text-right">المنتج</TableHead>
                    <TableHead className="text-right">الكمية</TableHead>
                    <TableHead className="text-right">السعر</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right w-[150px]">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">
                        {item.order_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="link" className="p-0 h-auto font-normal">
                              {item.order?.restaurant_profile?.business_name || "مطعم"}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>معلومات المطعم</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                                  <User className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div>
                                  <h3 className="font-semibold">
                                    {item.order?.restaurant_profile?.business_name || "غير محدد"}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    {item.order?.restaurant_profile?.full_name}
                                  </p>
                                </div>
                              </div>

                              {item.order?.restaurant_profile?.phone && (
                                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  <a 
                                    href={`tel:${item.order.restaurant_profile.phone}`}
                                    className="text-primary hover:underline"
                                  >
                                    {item.order.restaurant_profile.phone}
                                  </a>
                                </div>
                              )}

                              {(item.order?.restaurant_profile as any)?.google_maps_url && (
                                <a 
                                  href={(item.order?.restaurant_profile as any).google_maps_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-3 bg-muted rounded-lg hover:bg-muted/80"
                                >
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-primary">فتح في قوقل ماب</span>
                                  <ExternalLink className="h-3 w-3 mr-auto" />
                                </a>
                              )}

                              {item.order?.delivery_address && (
                                <div className="p-3 bg-muted rounded-lg">
                                  <p className="text-sm font-medium mb-1">عنوان التوصيل:</p>
                                  <p className="text-sm text-muted-foreground">
                                    {item.order.delivery_address}
                                  </p>
                                </div>
                              )}

                              {item.order?.notes && (
                                <div className="p-3 bg-muted rounded-lg">
                                  <p className="text-sm font-medium mb-1">ملاحظات:</p>
                                  <p className="text-sm text-muted-foreground">
                                    {item.order.notes}
                                  </p>
                                </div>
                              )}

                              <Link to={`/profile/${item.order?.restaurant_profile?.user_id}`}>
                                <Button variant="outline" className="w-full">
                                  <User className="h-4 w-4" />
                                  عرض الملف الشخصي
                                </Button>
                              </Link>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.product?.image_url ? (
                            <img
                              src={item.product.image_url}
                              alt={item.product?.name}
                              className="w-8 h-8 rounded object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <span>{item.product?.name || "منتج"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.quantity} {item.product?.unit}
                      </TableCell>
                      <TableCell>
                        {(item.unit_price * item.quantity).toFixed(2)} ر.س
                      </TableCell>
                      <TableCell>
                        {format(new Date(item.created_at), "d MMM yyyy", {
                          locale: ar,
                        })}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={item.status}
                          onValueChange={(value) =>
                            handleStatusChange(item.id, value)
                          }
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue>
                              <Badge
                                variant="secondary"
                                className={statusColors[item.status]}
                              >
                                {statusLabels[item.status] || item.status}
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  ArrowRight,
  Package,
  User,
} from "lucide-react";
import {
  useSupplierCustomPrices,
  useDeleteCustomPrice,
  CustomPrice,
} from "@/hooks/useCustomPrices";
import RestaurantProductPriceDialog from "@/components/supplier/RestaurantProductPriceDialog";

export default function SupplierRestaurantPrices() {
  const { t } = useTranslation();
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const { data: allCustomPrices, isLoading } = useSupplierCustomPrices();
  const deleteCustomPrice = useDeleteCustomPrice();

  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<CustomPrice | null>(null);
  const [deletingPriceId, setDeletingPriceId] = useState<string | null>(null);

  // فلترة الأسعار لهذا المطعم فقط
  const restaurantPrices = useMemo(() => {
    return allCustomPrices?.filter(cp => cp.restaurant_id === restaurantId) || [];
  }, [allCustomPrices, restaurantId]);

  // معلومات المطعم
  const restaurantInfo = restaurantPrices[0]?.restaurant_profile;

  // فلترة حسب البحث
  const filteredPrices = useMemo(() => {
    if (!searchQuery.trim()) return restaurantPrices;
    const query = searchQuery.toLowerCase();
    return restaurantPrices.filter(cp =>
      cp.product?.name?.toLowerCase().includes(query)
    );
  }, [restaurantPrices, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || userRole !== "supplier") {
    navigate("/dashboard");
    return null;
  }

  const handleEdit = (price: CustomPrice) => {
    setEditingPrice(price);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (deletingPriceId) {
      await deleteCustomPrice.mutateAsync(deletingPriceId);
      setDeletingPriceId(null);
    }
  };

  const handleCloseForm = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingPrice(null);
    }
  };

  const calculateDiscount = (originalPrice: number, customPrice: number) => {
    const diff = originalPrice - customPrice;
    const percentage = (diff / originalPrice) * 100;
    return percentage.toFixed(1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <Link
                to="/supplier/custom-prices"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
              >
                <ArrowRight className="h-4 w-4 ms-1 rtl:rotate-180" />
                العودة للمطاعم
              </Link>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    {restaurantInfo?.business_name || restaurantInfo?.full_name || "المطعم"}
                  </h1>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {restaurantInfo?.customer_code && (
                      <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">
                        {restaurantInfo.customer_code}
                      </span>
                    )}
                    <span>{restaurantPrices.length} منتج مخصص</span>
                  </div>
                </div>
              </div>
            </div>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-5 w-5" />
              إضافة منتج
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="البحث بالمنتج..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-10"
            />
          </div>

          {/* Products Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredPrices.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد منتجات مخصصة</h3>
              <p className="text-muted-foreground mb-4">
                أضف منتجات بأسعار مخصصة لهذا المطعم
              </p>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-5 w-5" />
                إضافة منتج
              </Button>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-start">المنتج</TableHead>
                    <TableHead className="text-start">السعر الأصلي</TableHead>
                    <TableHead className="text-start">السعر المخصص</TableHead>
                    <TableHead className="text-start">الخصم</TableHead>
                    <TableHead className="text-start w-[100px]">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrices.map((cp) => (
                    <TableRow key={cp.id}>
                      <TableCell>
                        <div className="font-medium">
                          {cp.product?.name || "منتج محذوف"}
                        </div>
                        {cp.product && (
                          <div className="text-sm text-muted-foreground">
                            {cp.product.unit}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {cp.product?.price?.toFixed(2) || "-"} {t("common.sar")}
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        {cp.custom_price.toFixed(2)} {t("common.sar")}
                      </TableCell>
                      <TableCell>
                        {cp.product?.price ? (
                          <Badge
                            variant={
                              cp.custom_price < cp.product.price
                                ? "default"
                                : "secondary"
                            }
                          >
                            {cp.custom_price < cp.product.price ? "-" : "+"}
                            {calculateDiscount(cp.product.price, cp.custom_price)}%
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(cp)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingPriceId(cp.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
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

      {/* Product Price Dialog */}
      <RestaurantProductPriceDialog
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        restaurantId={restaurantId!}
        restaurantName={restaurantInfo?.business_name || restaurantInfo?.full_name || "المطعم"}
        editingPrice={editingPrice}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingPriceId}
        onOpenChange={(open) => !open && setDeletingPriceId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف السعر المخصص</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا السعر المخصص؟ سيعود المطعم لرؤية السعر الأصلي.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

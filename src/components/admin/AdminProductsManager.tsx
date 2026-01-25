import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Loader2, Pencil, Trash2, Search, Package, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import AdminProductFormDialog from "./AdminProductFormDialog";

type AdminProduct = Tables<"products"> & {
  category?: Tables<"categories"> | null;
  supplier_profile?: Tables<"profiles"> | null;
  order_count?: number;
};

const useAdminProducts = () => {
  return useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      // Fetch products with categories
      const { data: products, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch supplier profiles
      const supplierIds = [...new Set(products?.map((p) => p.supplier_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", supplierIds);

      // Fetch order counts per product
      const { data: orderCounts } = await supabase
        .from("order_items")
        .select("product_id");

      // Calculate counts
      const countMap: Record<string, number> = {};
      orderCounts?.forEach((item) => {
        countMap[item.product_id] = (countMap[item.product_id] || 0) + 1;
      });

      // Map data
      return products?.map((product) => ({
        ...product,
        supplier_profile: profiles?.find((p) => p.user_id === product.supplier_id) || null,
        order_count: countMap[product.id] || 0,
      })) as AdminProduct[];
    },
  });
};

const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("تم حذف المنتج بنجاح");
    },
    onError: (error: any) => {
      console.error("Error deleting product:", error);
      if (error?.message?.includes("foreign key constraint") || error?.code === "23503") {
        toast.error("لا يمكن حذف هذا المنتج لأنه مرتبط بطلبات سابقة. يمكنك إلغاء تفعيله بدلاً من ذلك.");
      } else {
        toast.error("حدث خطأ أثناء حذف المنتج");
      }
    },
  });
};

const useDeactivateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from("products")
        .update({ in_stock: false })
        .eq("id", productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("تم إلغاء تفعيل المنتج بنجاح");
    },
    onError: (error) => {
      console.error("Error deactivating product:", error);
      toast.error("حدث خطأ أثناء إلغاء تفعيل المنتج");
    },
  });
};

const useActivateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from("products")
        .update({ in_stock: true })
        .eq("id", productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("تم تفعيل المنتج بنجاح");
    },
    onError: (error) => {
      console.error("Error activating product:", error);
      toast.error("حدث خطأ أثناء تفعيل المنتج");
    },
  });
};

export default function AdminProductsManager() {
  const { data: products, isLoading } = useAdminProducts();
  const deleteProduct = useDeleteProduct();
  const deactivateProduct = useDeactivateProduct();
  const activateProduct = useActivateProduct();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<AdminProduct | null>(null);

  const filteredProducts = products?.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.supplier_profile?.business_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (product: AdminProduct) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (deletingProduct) {
      await deleteProduct.mutateAsync(deletingProduct.id);
      setDeletingProduct(null);
    }
  };

  const handleDeactivate = async () => {
    if (deletingProduct) {
      await deactivateProduct.mutateAsync(deletingProduct.id);
      setDeletingProduct(null);
    }
  };

  const handleCloseForm = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingProduct(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="بحث بالاسم أو المورد..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ps-10"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>المنتج</TableHead>
              <TableHead>المورد</TableHead>
              <TableHead>السعر</TableHead>
              <TableHead>الكمية</TableHead>
              <TableHead>عدد الطلبات</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead className="text-left">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  لا توجد منتجات
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.category?.name || "بدون تصنيف"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {product.supplier_profile?.business_name || "غير معروف"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {product.price.toFixed(2)} ر.س
                    </span>
                    <span className="text-xs text-muted-foreground block">
                      / {product.unit}
                    </span>
                  </TableCell>
                  <TableCell>
                    {product.unlimited_stock ? (
                      <Badge variant="outline">غير محدود</Badge>
                    ) : (
                      <span>{product.stock_quantity ?? 0}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{product.order_count}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.in_stock ? "default" : "destructive"}>
                      {product.in_stock ? "متوفر" : "غير متوفر"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(product)}
                        title="تعديل المنتج"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {product.in_stock ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-orange-500 hover:text-orange-600"
                          onClick={() => deactivateProduct.mutate(product.id)}
                          disabled={deactivateProduct.isPending}
                          title="إلغاء تفعيل المنتج"
                        >
                          {deactivateProduct.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <PowerOff className="h-4 w-4" />
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-green-500 hover:text-green-600"
                          onClick={() => activateProduct.mutate(product.id)}
                          disabled={activateProduct.isPending}
                          title="تفعيل المنتج"
                        >
                          {activateProduct.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeletingProduct(product)}
                        title={product.order_count && product.order_count > 0 ? "هذا المنتج مرتبط بطلبات" : "حذف المنتج"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <AdminProductFormDialog
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        product={editingProduct}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingProduct} onOpenChange={() => setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deletingProduct?.order_count && deletingProduct.order_count > 0 
                ? "لا يمكن حذف هذا المنتج" 
                : "هل أنت متأكد من حذف هذا المنتج؟"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deletingProduct?.order_count && deletingProduct.order_count > 0 
                ? `هذا المنتج مرتبط بـ ${deletingProduct.order_count} طلب(ات) سابقة. يمكنك إلغاء تفعيله بدلاً من ذلك ليصبح غير متوفر للطلبات الجديدة.`
                : "هذا الإجراء لا يمكن التراجع عنه. سيتم حذف المنتج نهائياً."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            {deletingProduct?.order_count && deletingProduct.order_count > 0 ? (
              <AlertDialogAction
                onClick={handleDeactivate}
                className="bg-orange-500 text-white hover:bg-orange-600"
              >
                {deactivateProduct.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "إلغاء التفعيل"
                )}
              </AlertDialogAction>
            ) : (
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteProduct.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "حذف"
                )}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

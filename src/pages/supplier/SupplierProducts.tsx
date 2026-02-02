import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Package,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useSupplierProducts, useDeleteProduct } from "@/hooks/useSupplierProducts";
import ProductFormDialog from "@/components/supplier/ProductFormDialog";
import type { SupplierProduct } from "@/hooks/useSupplierProducts";
import { Link } from "react-router-dom";
import { useCategoryTranslation } from "@/hooks/useCategoryTranslation";

export default function SupplierProducts() {
  const { t } = useTranslation();
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const { data: products, isLoading } = useSupplierProducts();
  const deleteProduct = useDeleteProduct();
  const { getCategoryName } = useCategoryTranslation();

  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SupplierProduct | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

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

  const filteredProducts = products?.filter((product) => {
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      (product.sku && product.sku.toLowerCase().includes(query))
    );
  }) || [];

  const handleEdit = (product: SupplierProduct) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (deletingProductId) {
      await deleteProduct.mutateAsync(deletingProductId);
      setDeletingProductId(null);
    }
  };

  const handleCloseForm = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingProduct(null);
    }
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
                to="/dashboard"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
              >
                <ArrowRight className="h-4 w-4 ms-1 rtl:rotate-180" />
                {t("supplier.backToDashboard")}
              </Link>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Package className="h-7 w-7 text-primary" />
                {t("supplier.productsManagement")}
              </h1>
              <p className="text-muted-foreground">
                {products?.length || 0} {t("supplier.productCount")}
              </p>
            </div>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-5 w-5" />
              {t("supplier.addProduct")}
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={t("supplier.searchProductOrSku")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-10"
            />
          </div>

          {/* Products Table */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("supplier.noProducts")}</h3>
              <p className="text-muted-foreground mb-4">
                {t("supplier.startAddingProducts")}
              </p>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-5 w-5" />
                {t("supplier.addProduct")}
              </Button>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-start">{t("supplier.tableProduct")}</TableHead>
                    <TableHead className="text-start">{t("supplier.tableCategory")}</TableHead>
                    <TableHead className="text-start">{t("supplier.tablePrice")}</TableHead>
                    <TableHead className="text-start">{t("supplier.tableStock")}</TableHead>
                    <TableHead className="text-start">{t("supplier.tableStatus")}</TableHead>
                    <TableHead className="text-start w-[100px]">{t("supplier.tableActions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {product.country_of_origin}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.category ? getCategoryName(product.category) : "-"}
                      </TableCell>
                      <TableCell>
                        {product.price.toFixed(2)} {t("common.sar")}/{product.unit}
                      </TableCell>
                      <TableCell>
                        {product.stock_quantity || 0}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={product.in_stock ? "default" : "secondary"}
                        >
                          {product.in_stock ? t("supplier.available") : t("supplier.unavailable")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingProductId(product.id)}
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

      {/* Product Form Dialog */}
      <ProductFormDialog
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        product={editingProduct}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingProductId}
        onOpenChange={(open) => !open && setDeletingProductId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("supplier.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("supplier.deleteConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

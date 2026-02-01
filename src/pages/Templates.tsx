import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useOrderTemplates, useDeleteTemplate, type OrderTemplate } from "@/hooks/useOrderTemplates";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { FileText, Loader2, Trash2, ShoppingCart, ArrowRight, Package } from "lucide-react";
import { toast } from "sonner";

export default function Templates() {
  const { t, i18n } = useTranslation();
  const { user, userRole, loading: authLoading } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const { data: templates, isLoading } = useOrderTemplates();
  const deleteTemplate = useDeleteTemplate();

  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  // Redirect non-restaurants
  if (!authLoading && (!user || userRole !== "restaurant")) {
    navigate("/dashboard");
    return null;
  }

  const handleAddToCart = (template: OrderTemplate) => {
    if (!template.items || template.items.length === 0) {
      toast.error(t("templates.noItems"));
      return;
    }

    let addedCount = 0;
    let unavailableCount = 0;

    template.items.forEach((item) => {
      if (item.product && item.product.in_stock) {
        // Construct product object for cart
        const product = {
          id: item.product.id,
          name: item.product.name,
          name_en: item.product.name_en || null,
          price: item.product.price,
          unit: item.product.unit,
          image_url: item.product.image_url || null,
          supplier_id: item.product.supplier_id,
          in_stock: item.product.in_stock,
          supplier_profile: item.product.supplier_profile || null,
          // Required fields with defaults
          created_at: "",
          updated_at: "",
          description: null,
          description_en: null,
          category_id: null,
          subcategory_id: null,
          stock_quantity: null,
          unlimited_stock: true,
          sku: null,
          country_of_origin: null,
          delivery_fee: 0,
        };
        addItem(product as any, item.quantity);
        addedCount++;
      } else {
        unavailableCount++;
      }
    });

    if (addedCount > 0) {
      toast.success(t("templates.addedToCart", { count: addedCount }));
    }
    if (unavailableCount > 0) {
      toast.warning(t("templates.someUnavailable", { count: unavailableCount }));
    }
  };

  const handleDeleteConfirm = () => {
    if (templateToDelete) {
      deleteTemplate.mutate(templateToDelete);
      setTemplateToDelete(null);
    }
  };

  const getProductName = (product: any) => {
    if (!product) return t("orders.deletedProduct");
    return i18n.language === "en" && product.name_en ? product.name_en : product.name;
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
              {t("templates.backToDashboard")}
            </Link>
            <div className="flex items-center gap-3">
              <FileText className="h-7 w-7 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">{t("templates.title")}</h1>
                <p className="text-sm text-muted-foreground">
                  {templates?.length || 0} {t("templates.templatesCount")}
                </p>
              </div>
            </div>
          </div>

          {/* Templates List */}
          {templates?.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("templates.noTemplates")}</h3>
              <p className="text-muted-foreground mb-4">{t("templates.noTemplatesMessage")}</p>
              <Link to="/products">
                <Button variant="hero">
                  {t("templates.browseProducts")}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates?.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      {template.name}
                    </CardTitle>
                    {template.description && (
                      <CardDescription>{template.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Products preview */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        {template.items?.length || 0} {t("templates.products")}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {template.items?.slice(0, 3).map((item) => (
                          <span
                            key={item.id}
                            className="text-xs bg-muted px-2 py-1 rounded-full"
                          >
                            {getProductName(item.product)} × {item.quantity}
                          </span>
                        ))}
                        {(template.items?.length || 0) > 3 && (
                          <span className="text-xs bg-muted px-2 py-1 rounded-full">
                            +{(template.items?.length || 0) - 3}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="hero"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleAddToCart(template)}
                      >
                        <ShoppingCart className="h-4 w-4 me-1" />
                        {t("templates.addToCart")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTemplateToDelete(template.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!templateToDelete} onOpenChange={() => setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("templates.deleteTemplate")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("templates.deleteConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
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

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface SupplierCategory {
  id: string;
  name: string;
  name_en: string | null;
  icon: string | null;
  created_at: string;
}

const AdminSupplierCategoriesManager = () => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const currentLang = i18n.language;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SupplierCategory | null>(null);
  const [formData, setFormData] = useState({ name: "", name_en: "", icon: "" });

  // Fetch supplier categories
  const { data: categories, isLoading } = useQuery({
    queryKey: ["supplier-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplier_categories")
        .select("*")
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data as SupplierCategory[];
    },
  });

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: async (data: { name: string; name_en?: string; icon?: string }) => {
      const { error } = await supabase
        .from("supplier_categories")
        .insert({
          name: data.name,
          name_en: data.name_en || null,
          icon: data.icon || null,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-categories"] });
      toast.success(t("admin.categoryAdded"));
      setIsDialogOpen(false);
      setFormData({ name: "", name_en: "", icon: "" });
    },
    onError: () => {
      toast.error(t("common.error"));
    },
  });

  // Update category mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; name_en?: string | null; icon?: string | null }) => {
      const { error } = await supabase
        .from("supplier_categories")
        .update({
          name: data.name,
          name_en: data.name_en,
          icon: data.icon,
        })
        .eq("id", data.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-categories"] });
      toast.success(t("admin.categoryUpdated"));
      setIsDialogOpen(false);
      setEditingCategory(null);
      setFormData({ name: "", name_en: "", icon: "" });
    },
    onError: () => {
      toast.error(t("common.error"));
    },
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("supplier_categories")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-categories"] });
      toast.success(t("admin.categoryDeleted"));
    },
    onError: () => {
      toast.error(t("common.error"));
    },
  });

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({ name: "", name_en: "", icon: "" });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (category: SupplierCategory) => {
    setEditingCategory(category);
    setFormData({ 
      name: category.name, 
      name_en: category.name_en || "", 
      icon: category.icon || "" 
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCategory) {
      await updateMutation.mutateAsync({
        id: editingCategory.id,
        name: formData.name,
        name_en: formData.name_en || null,
        icon: formData.icon || null,
      });
    } else {
      await createMutation.mutateAsync({
        name: formData.name,
        name_en: formData.name_en || undefined,
        icon: formData.icon || undefined,
      });
    }
  };

  const handleDelete = async (categoryId: string) => {
    await deleteMutation.mutateAsync(categoryId);
  };

  const getCategoryDisplayName = (category: SupplierCategory): string => {
    if (currentLang === "en" && category.name_en) {
      return category.name_en;
    }
    return category.name;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">
          {t("admin.supplierCategories")} ({categories?.length || 0})
        </h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 me-2" />
              {t("admin.addCategory")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? t("admin.editCategory") : t("admin.addNewCategory")}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">{t("admin.categoryName")}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t("admin.categoryNamePlaceholder")}
                  required
                />
              </div>
              <div>
                <Label htmlFor="name_en">{t("admin.categoryNameEn")}</Label>
                <Input
                  id="name_en"
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  placeholder={t("admin.categoryNameEnPlaceholder")}
                  dir="ltr"
                />
              </div>
              <div>
                <Label htmlFor="icon">{t("admin.categoryIcon")}</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder={t("admin.categoryIconPlaceholder")}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  )}
                  {editingCategory ? t("admin.saveChanges") : t("common.add")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories?.map((category) => (
          <div
            key={category.id}
            className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div>
                <span className="font-medium block">{getCategoryDisplayName(category)}</span>
                {category.name_en && currentLang !== "en" && (
                  <span className="text-sm text-muted-foreground">{category.name_en}</span>
                )}
                {currentLang === "en" && (
                  <span className="text-sm text-muted-foreground">{category.name}</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleOpenEdit(category)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("admin.deleteCategory")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("admin.deleteCategoryConfirm", { name: getCategoryDisplayName(category) })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(category.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {t("common.delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSupplierCategoriesManager;

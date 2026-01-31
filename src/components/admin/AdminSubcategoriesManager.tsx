import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Plus, Pencil, Trash2, ChevronDown, ChevronRight, FolderTree } from "lucide-react";
import { useAdminCategories } from "@/hooks/useAdminData";
import { useSubcategories, useCreateSubcategory, useUpdateSubcategory, useDeleteSubcategory, type Subcategory } from "@/hooks/useSubcategories";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const AdminSubcategoriesManager = () => {
  const { t, i18n } = useTranslation();
  const { data: categories, isLoading: categoriesLoading } = useAdminCategories();
  const { data: subcategories, isLoading: subcategoriesLoading } = useSubcategories();
  const createSubcategory = useCreateSubcategory();
  const updateSubcategory = useUpdateSubcategory();
  const deleteSubcategory = useDeleteSubcategory();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [formData, setFormData] = useState({ category_id: "", name: "", name_en: "", icon: "" });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // تجميع الأقسام الفرعية حسب التصنيف
  const subcategoriesByCategory = useMemo(() => {
    if (!subcategories) return new Map<string, Subcategory[]>();
    
    const map = new Map<string, Subcategory[]>();
    subcategories.forEach((sub) => {
      const existing = map.get(sub.category_id) || [];
      map.set(sub.category_id, [...existing, sub]);
    });
    return map;
  }, [subcategories]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleOpenCreate = (categoryId?: string) => {
    setEditingSubcategory(null);
    setFormData({ category_id: categoryId || "", name: "", name_en: "", icon: "" });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (subcategory: Subcategory) => {
    setEditingSubcategory(subcategory);
    setFormData({
      category_id: subcategory.category_id,
      name: subcategory.name,
      name_en: subcategory.name_en || "",
      icon: subcategory.icon || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingSubcategory) {
      await updateSubcategory.mutateAsync({
        id: editingSubcategory.id,
        name: formData.name,
        name_en: formData.name_en || null,
        icon: formData.icon || null,
      });
    } else {
      await createSubcategory.mutateAsync({
        category_id: formData.category_id,
        name: formData.name,
        name_en: formData.name_en || undefined,
        icon: formData.icon || undefined,
      });
    }

    setIsDialogOpen(false);
    setFormData({ category_id: "", name: "", name_en: "", icon: "" });
  };

  const handleDelete = async (subcategoryId: string) => {
    await deleteSubcategory.mutateAsync(subcategoryId);
  };

  const getCategoryName = (category: { name: string; name_en?: string | null }) => {
    return i18n.language === "en" && category.name_en ? category.name_en : category.name;
  };

  const getSubcategoryDisplayName = (subcategory: Subcategory) => {
    return i18n.language === "en" && subcategory.name_en ? subcategory.name_en : subcategory.name;
  };

  const isLoading = categoriesLoading || subcategoriesLoading;

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
        <div className="flex items-center gap-3">
          <FolderTree className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">
            {t("admin.manageSubcategories", "إدارة الأقسام الفرعية")} ({subcategories?.length || 0})
          </h3>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenCreate()}>
              <Plus className="h-4 w-4 me-2" />
              {t("admin.addSubcategory", "إضافة قسم فرعي")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSubcategory
                  ? t("admin.editSubcategory", "تعديل القسم الفرعي")
                  : t("admin.addNewSubcategory", "إضافة قسم فرعي جديد")}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="category">{t("admin.parentCategory", "التصنيف الرئيسي")}</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  disabled={!!editingSubcategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("admin.selectCategory", "اختر التصنيف")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {getCategoryName(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="name">{t("admin.subcategoryName", "اسم القسم الفرعي")}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t("admin.subcategoryNamePlaceholder", "مثال: لحوم مجمدة")}
                  required
                />
              </div>
              <div>
                <Label htmlFor="name_en">{t("admin.subcategoryNameEn", "الاسم بالإنجليزية")}</Label>
                <Input
                  id="name_en"
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  placeholder="e.g. Frozen Meats"
                  dir="ltr"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={createSubcategory.isPending || updateSubcategory.isPending || !formData.category_id}>
                  {(createSubcategory.isPending || updateSubcategory.isPending) && (
                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  )}
                  {editingSubcategory ? t("admin.saveChanges", "حفظ التغييرات") : t("common.add", "إضافة")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {categories?.map((category) => {
          const categorySubs = subcategoriesByCategory.get(category.id) || [];
          const isExpanded = expandedCategories.has(category.id);

          return (
            <Collapsible key={category.id} open={isExpanded} onOpenChange={() => toggleCategory(category.id)}>
              <div className="bg-muted/50 rounded-xl overflow-hidden">
                <CollapsibleTrigger asChild>
                  <button className="flex items-center justify-between w-full p-4 hover:bg-muted/70 transition-colors text-start">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium">{getCategoryName(category)}</span>
                      <span className="text-sm text-muted-foreground">({categorySubs.length})</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenCreate(category.id);
                      }}
                    >
                      <Plus className="h-4 w-4 me-1" />
                      {t("admin.addSubcategory", "إضافة قسم")}
                    </Button>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4">
                    {categorySubs.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2 ps-7">
                        {t("admin.noSubcategories", "لا توجد أقسام فرعية")}
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 ps-7">
                        {categorySubs.map((subcategory) => (
                          <div
                            key={subcategory.id}
                            className="flex items-center justify-between p-3 bg-background rounded-lg border"
                          >
                            <div>
                              <span className="font-medium block">{subcategory.name}</span>
                              {subcategory.name_en && (
                                <span className="text-sm text-muted-foreground">{subcategory.name_en}</span>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(subcategory)}>
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
                                    <AlertDialogTitle>{t("admin.deleteSubcategory", "حذف القسم الفرعي")}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t("admin.deleteSubcategoryConfirm", "هل أنت متأكد من حذف القسم الفرعي {{name}}؟", { name: getSubcategoryDisplayName(subcategory) })}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(subcategory.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      {t("common.delete", "حذف")}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
};

export default AdminSubcategoriesManager;

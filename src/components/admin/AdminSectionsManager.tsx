import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Plus, Pencil, Trash2, ChevronDown, ChevronRight, Layers } from "lucide-react";
import { useAdminCategories } from "@/hooks/useAdminData";
import { useSubcategories, type Subcategory, getSubcategoryName } from "@/hooks/useSubcategories";
import { useSections, useCreateSection, useUpdateSection, useDeleteSection, type Section, getSectionName } from "@/hooks/useSections";
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

const AdminSectionsManager = () => {
  const { t, i18n } = useTranslation();
  const { data: categories, isLoading: categoriesLoading } = useAdminCategories();
  const { data: subcategories, isLoading: subcategoriesLoading } = useSubcategories();
  const { data: sections, isLoading: sectionsLoading } = useSections();
  const createSection = useCreateSection();
  const updateSection = useUpdateSection();
  const deleteSection = useDeleteSection();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [formData, setFormData] = useState({ subcategory_id: "", name: "", name_en: "" });
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");

  // تجميع الأقسام الداخلية حسب القسم الفرعي
  const sectionsBySubcategory = useMemo(() => {
    if (!sections) return new Map<string, Section[]>();
    
    const map = new Map<string, Section[]>();
    sections.forEach((sec) => {
      const existing = map.get(sec.subcategory_id) || [];
      map.set(sec.subcategory_id, [...existing, sec]);
    });
    return map;
  }, [sections]);

  // تصفية الأقسام الفرعية حسب التصنيف المختار
  const filteredSubcategories = useMemo(() => {
    if (!subcategories) return [];
    if (selectedCategoryFilter === "all") return subcategories;
    return subcategories.filter(sub => sub.category_id === selectedCategoryFilter);
  }, [subcategories, selectedCategoryFilter]);

  const toggleSubcategory = (subcategoryId: string) => {
    setExpandedSubcategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(subcategoryId)) {
        newSet.delete(subcategoryId);
      } else {
        newSet.add(subcategoryId);
      }
      return newSet;
    });
  };

  const handleOpenCreate = (subcategoryId?: string) => {
    setEditingSection(null);
    setFormData({ subcategory_id: subcategoryId || "", name: "", name_en: "" });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (section: Section) => {
    setEditingSection(section);
    setFormData({
      subcategory_id: section.subcategory_id,
      name: section.name,
      name_en: section.name_en || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingSection) {
      await updateSection.mutateAsync({
        id: editingSection.id,
        name: formData.name,
        name_en: formData.name_en || null,
      });
    } else {
      await createSection.mutateAsync({
        subcategory_id: formData.subcategory_id,
        name: formData.name,
        name_en: formData.name_en || undefined,
      });
    }

    setIsDialogOpen(false);
    setFormData({ subcategory_id: "", name: "", name_en: "" });
  };

  const handleDelete = async (sectionId: string) => {
    await deleteSection.mutateAsync(sectionId);
  };

  const getCategoryName = (category: { name: string; name_en?: string | null }) => {
    return i18n.language === "en" && category.name_en ? category.name_en : category.name;
  };

  const isLoading = categoriesLoading || subcategoriesLoading || sectionsLoading;

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
          <Layers className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">
            إدارة الأقسام الداخلية ({sections?.length || 0})
          </h3>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenCreate()}>
              <Plus className="h-4 w-4 me-2" />
              إضافة قسم داخلي
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSection ? "تعديل القسم الداخلي" : "إضافة قسم داخلي جديد"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="subcategory">القسم الفرعي</Label>
                <Select
                  value={formData.subcategory_id}
                  onValueChange={(value) => setFormData({ ...formData, subcategory_id: value })}
                  disabled={!!editingSection}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر القسم الفرعي" />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories?.map((subcategory) => (
                      <SelectItem key={subcategory.id} value={subcategory.id}>
                        {getSubcategoryName(subcategory, i18n.language)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="name">اسم القسم الداخلي</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: دجاج طازج"
                  required
                />
              </div>
              <div>
                <Label htmlFor="name_en">الاسم بالإنجليزية</Label>
                <Input
                  id="name_en"
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  placeholder="e.g. Fresh Chicken"
                  dir="ltr"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={createSection.isPending || updateSection.isPending || !formData.subcategory_id}>
                  {(createSection.isPending || updateSection.isPending) && (
                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  )}
                  {editingSection ? "حفظ التغييرات" : "إضافة"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter by Category */}
      <div className="mb-4">
        <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue placeholder="تصفية حسب التصنيف" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع التصنيفات</SelectItem>
            {categories?.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {getCategoryName(category)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filteredSubcategories.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            لا توجد أقسام فرعية
          </p>
        ) : (
          filteredSubcategories.map((subcategory) => {
            const subcategorySections = sectionsBySubcategory.get(subcategory.id) || [];
            const isExpanded = expandedSubcategories.has(subcategory.id);

            return (
              <Collapsible key={subcategory.id} open={isExpanded} onOpenChange={() => toggleSubcategory(subcategory.id)}>
                <div className="bg-muted/50 rounded-xl overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center justify-between w-full p-4 hover:bg-muted/70 transition-colors text-start">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium">{getSubcategoryName(subcategory, i18n.language)}</span>
                        <span className="text-sm text-muted-foreground">({subcategorySections.length})</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCreate(subcategory.id);
                        }}
                      >
                        <Plus className="h-4 w-4 me-1" />
                        إضافة
                      </Button>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4">
                      {subcategorySections.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2 ps-7">
                          لا توجد أقسام داخلية
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 ps-7">
                          {subcategorySections.map((section) => (
                            <div
                              key={section.id}
                              className="flex items-center justify-between p-3 bg-background rounded-lg border"
                            >
                              <div>
                                <span className="font-medium block">{section.name}</span>
                                {section.name_en && (
                                  <span className="text-sm text-muted-foreground">{section.name_en}</span>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(section)}>
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
                                      <AlertDialogTitle>حذف القسم الداخلي</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        هل أنت متأكد من حذف القسم الداخلي "{getSectionName(section, i18n.language)}"؟
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(section.id)}
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
          })
        )}
      </div>
    </div>
  );
};

export default AdminSectionsManager;

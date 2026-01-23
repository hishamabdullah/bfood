import { useState } from "react";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { useAdminCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useAdminData";
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

const AdminCategoriesManager = () => {
  const { data: categories, isLoading } = useAdminCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; icon: string } | null>(null);
  const [formData, setFormData] = useState({ name: "", icon: "" });

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({ name: "", icon: "" });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (category: { id: string; name: string; icon: string | null }) => {
    setEditingCategory({ id: category.id, name: category.name, icon: category.icon || "" });
    setFormData({ name: category.name, icon: category.icon || "" });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCategory) {
      await updateCategory.mutateAsync({
        id: editingCategory.id,
        name: formData.name,
        icon: formData.icon || null,
      });
    } else {
      await createCategory.mutateAsync({
        name: formData.name,
        icon: formData.icon || undefined,
      });
    }
    
    setIsDialogOpen(false);
    setFormData({ name: "", icon: "" });
  };

  const handleDelete = async (categoryId: string) => {
    await deleteCategory.mutateAsync(categoryId);
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
        <h3 className="text-lg font-semibold">إدارة التصنيفات ({categories?.length || 0})</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة تصنيف
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? "تعديل التصنيف" : "إضافة تصنيف جديد"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">اسم التصنيف</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: خضروات"
                  required
                />
              </div>
              <div>
                <Label htmlFor="icon">الأيقونة (emoji)</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="مثال: 🥬"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
                  {(createCategory.isPending || updateCategory.isPending) && (
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  )}
                  {editingCategory ? "حفظ التعديلات" : "إضافة"}
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
              <span className="text-2xl">{category.icon || "📦"}</span>
              <span className="font-medium">{category.name}</span>
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
                    <AlertDialogTitle>حذف التصنيف</AlertDialogTitle>
                    <AlertDialogDescription>
                      هل أنت متأكد من حذف تصنيف "{category.name}"؟ هذا الإجراء لا يمكن التراجع عنه.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(category.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      حذف
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

export default AdminCategoriesManager;

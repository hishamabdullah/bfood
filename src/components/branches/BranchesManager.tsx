import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBranches, useDeleteBranch, useMaxBranchesLimit, type Branch } from "@/hooks/useBranches";
import { BranchFormDialog } from "./BranchFormDialog";
import { Plus, MapPin, Pencil, Trash2, Building2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
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

export const BranchesManager = () => {
  const { data: branches = [], isLoading } = useBranches();
  const { data: branchLimit } = useMaxBranchesLimit();
  const deleteBranch = useDeleteBranch();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [deletingBranchId, setDeletingBranchId] = useState<string | null>(null);

  const canAddMoreBranches = branchLimit 
    ? branchLimit.currentCount < branchLimit.maxBranches 
    : true;

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    if (!canAddMoreBranches) {
      toast.error(`خطتك تسمح بحد أقصى ${branchLimit?.maxBranches} فروع فقط`);
      return;
    }
    setEditingBranch(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingBranchId) return;
    
    try {
      await deleteBranch.mutateAsync(deletingBranchId);
      toast.success("تم حذف الفرع بنجاح");
    } catch (error: any) {
      console.error("Delete branch error:", error);
      toast.error(error?.message || "حدث خطأ أثناء حذف الفرع");
    } finally {
      setDeletingBranchId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              فروع المطعم
            </CardTitle>
            {branchLimit && (
              <p className="text-sm text-muted-foreground mt-1">
                {branchLimit.currentCount} من {branchLimit.maxBranches} فروع
              </p>
            )}
          </div>
          <Button 
            onClick={handleAdd} 
            size="sm"
            disabled={!canAddMoreBranches}
            title={!canAddMoreBranches ? `خطتك تسمح بحد أقصى ${branchLimit?.maxBranches} فروع فقط` : undefined}
          >
            <Plus className="h-4 w-4 ml-1" />
            إضافة فرع
          </Button>
        </CardHeader>
        <CardContent>
          {branches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>لم تقم بإضافة أي فروع بعد</p>
              <p className="text-sm mt-1">أضف فروعك لتسهيل تحديد عنوان التوصيل عند الطلب</p>
            </div>
          ) : (
            <div className="space-y-3">
              {branches.map((branch) => (
                <div
                  key={branch.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{branch.name}</h4>
                      {branch.is_default && (
                        <Badge variant="secondary" className="text-xs">
                          افتراضي
                        </Badge>
                      )}
                    </div>
                    {branch.address && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {branch.address}
                      </p>
                    )}
                    {branch.google_maps_url && (
                      <a
                        href={branch.google_maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-1"
                      >
                        <MapPin className="h-3 w-3" />
                        عرض على الخريطة
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(branch)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingBranchId(branch.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <BranchFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        branch={editingBranch}
      />

      <AlertDialog open={!!deletingBranchId} onOpenChange={() => setDeletingBranchId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذا الفرع؟</AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
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
    </>
  );
};

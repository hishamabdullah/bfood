import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Pencil, Trash2, Crown, Check, X } from "lucide-react";
import {
  useSubscriptionPlans,
  useDeleteSubscriptionPlan,
  useUpdateSubscriptionPlan,
} from "@/hooks/useSubscriptionPlans";
import SubscriptionPlanFormDialog from "./SubscriptionPlanFormDialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const AdminSubscriptionPlansManager = () => {
  const { data: plans, isLoading } = useSubscriptionPlans();
  const deletePlan = useDeleteSubscriptionPlan();
  const updatePlan = useUpdateSubscriptionPlan();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<string | null>(null);

  const handleEdit = (planId: string) => {
    setEditingPlan(planId);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (deletingPlan) {
      await deletePlan.mutateAsync(deletingPlan);
      setDeletingPlan(null);
    }
  };

  const handleToggleActive = async (planId: string, isActive: boolean) => {
    await updatePlan.mutateAsync({ id: planId, is_active: isActive });
  };

  const featureLabels: Record<string, string> = {
    can_order: "الطلب",
    can_use_templates: "القوالب",
    can_use_branches: "الفروع",
    can_use_favorites: "المفضلة",
    can_view_analytics: "التحليلات",
    can_use_custom_prices: "أسعار مخصصة",
    can_repeat_orders: "إعادة الطلب",
    can_manage_sub_users: "المستخدمين الفرعيين",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="h-6 w-6 text-primary" />
            خطط الاشتراكات
          </h2>
          <p className="text-muted-foreground">إنشاء وإدارة خطط الاشتراكات</p>
        </div>
        <Button onClick={() => { setEditingPlan(null); setIsFormOpen(true); }}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة خطة
        </Button>
      </div>

      {/* جدول الخطط */}
      <Card>
        <CardHeader>
          <CardTitle>الخطط المتاحة ({plans?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {plans && plans.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>المدة</TableHead>
                  <TableHead>الميزات</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{plan.name}</div>
                        {plan.name_en && (
                          <div className="text-sm text-muted-foreground">{plan.name_en}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">
                        {plan.price} ر.س
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {plan.duration_months} {plan.duration_months === 1 ? "شهر" : "أشهر"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {Object.entries(featureLabels).map(([key, label]) => {
                          const hasFeature = plan[key as keyof typeof plan];
                          if (!hasFeature) return null;
                          return (
                            <Badge key={key} variant="outline" className="text-xs">
                              <Check className="h-3 w-3 ml-1 text-green-500" />
                              {label}
                            </Badge>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={plan.is_active}
                        onCheckedChange={(checked) => handleToggleActive(plan.id, checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(plan.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingPlan(plan.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد خطط اشتراك. أضف خطة جديدة للبدء.
            </div>
          )}
        </CardContent>
      </Card>

      {/* نموذج إضافة/تعديل */}
      <SubscriptionPlanFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        planId={editingPlan}
      />

      {/* تأكيد الحذف */}
      <AlertDialog open={!!deletingPlan} onOpenChange={() => setDeletingPlan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف خطة الاشتراك</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه الخطة؟ لن تتمكن من التراجع عن هذا الإجراء.
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
};

export default AdminSubscriptionPlansManager;

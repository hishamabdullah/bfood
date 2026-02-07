import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Users, Pencil, Trash2, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSubUsers, useDeleteSubUser, useUpdateSubUser } from "@/hooks/useSubUsers";
import { useRestaurantAccess } from "@/hooks/useRestaurantAccess";
import { useBranches } from "@/hooks/useBranches";
import SubUserFormDialog from "@/components/sub-users/SubUserFormDialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useHasFeature } from "@/hooks/useRestaurantAccess";

const SubUsersPage = () => {
  const { t } = useTranslation();
  const { userRole } = useAuth();
  const { data: subUsers, isLoading } = useSubUsers();
  const { data: features } = useRestaurantAccess();
  const { data: branches } = useBranches();
  const deleteSubUser = useDeleteSubUser();
  const updateSubUser = useUpdateSubUser();
  const { hasFeature: canManageSubUsers } = useHasFeature("can_manage_sub_users");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSubUser, setSelectedSubUser] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subUserToDelete, setSubUserToDelete] = useState<string | null>(null);

  // التحقق من الوصول
  if (userRole !== "restaurant") {
    return <Navigate to="/dashboard" replace />;
  }

  if (!canManageSubUsers) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-16 text-center">
              <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                خطتك الحالية لا تدعم المستخدمين الفرعيين
              </h2>
              <p className="text-muted-foreground">
                قم بترقية خطتك للوصول لهذه الميزة
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const currentCount = subUsers?.filter((s) => s.is_active).length ?? 0;
  const maxCount = features?.max_sub_users ?? 3;

  const handleEdit = (subUser: any) => {
    setSelectedSubUser(subUser);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setSubUserToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (subUserToDelete) {
      await deleteSubUser.mutateAsync(subUserToDelete);
      setDeleteDialogOpen(false);
      setSubUserToDelete(null);
    }
  };

  const handleToggleActive = async (subUser: any) => {
    await updateSubUser.mutateAsync({
      sub_user_id: subUser.id,
      is_active: !subUser.is_active,
    });
  };

  const getBranchNames = (branchIds: string[]) => {
    if (!branches || branchIds.length === 0) return "جميع الفروع";
    return branches
      .filter((b) => branchIds.includes(b.id))
      .map((b) => b.name)
      .join("، ");
  };

  const getPermissionsSummary = (permissions: any) => {
    if (!permissions) return [];
    const summary = [];
    if (permissions.can_see_prices) summary.push("رؤية الأسعار");
    if (permissions.can_edit_order) summary.push("تعديل الطلبات");
    if (permissions.can_cancel_order) summary.push("إلغاء الطلبات");
    if (permissions.can_see_favorite_suppliers_only) summary.push("موردين مفضلين فقط");
    if (permissions.can_see_favorite_products_only) summary.push("منتجات مفضلة فقط");
    return summary;
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              المستخدمين الفرعيين
            </h1>
            <p className="text-muted-foreground mt-1">
              {currentCount} من {maxCount} مستخدم
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedSubUser(null);
              setIsFormOpen(true);
            }}
            disabled={currentCount >= maxCount}
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة مستخدم
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : subUsers && subUsers.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {subUsers.map((subUser) => (
              <Card
                key={subUser.id}
                className={!subUser.is_active ? "opacity-60" : ""}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{subUser.full_name}</CardTitle>
                      <CardDescription>
                        {subUser.phone || "بدون رقم هاتف"}
                      </CardDescription>
                    </div>
                    <Badge variant={subUser.is_active ? "default" : "secondary"}>
                      {subUser.is_active ? "نشط" : "معطل"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">الفروع:</p>
                    <p className="text-sm text-muted-foreground">
                      {getBranchNames(subUser.branch_ids)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">الصلاحيات:</p>
                    <div className="flex flex-wrap gap-1">
                      {getPermissionsSummary(subUser.permissions).map((perm, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {perm}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(subUser)}
                    >
                      <Pencil className="h-4 w-4 ml-1" />
                      تعديل
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(subUser)}
                    >
                      {subUser.is_active ? (
                        <>
                          <PowerOff className="h-4 w-4 ml-1" />
                          تعطيل
                        </>
                      ) : (
                        <>
                          <Power className="h-4 w-4 ml-1" />
                          تفعيل
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(subUser.id)}
                    >
                      <Trash2 className="h-4 w-4 ml-1" />
                      حذف
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                لا يوجد مستخدمين فرعيين
              </h2>
              <p className="text-muted-foreground mb-4">
                أضف مستخدمين فرعيين لمساعدتك في إدارة الطلبات
              </p>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة مستخدم
              </Button>
            </CardContent>
          </Card>
        )}

        <SubUserFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          subUser={selectedSubUser}
          branches={branches || []}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف هذا المستخدم الفرعي؟ سيتم حذف حسابه بشكل نهائي
                ولن يتمكن من تسجيل الدخول.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default SubUsersPage;

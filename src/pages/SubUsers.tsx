import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  Users,
  Plus,
  Pencil,
  Trash2,
  Power,
  PowerOff,
  Eye,
  EyeOff,
  ShoppingCart,
  XCircle,
  CheckCircle,
  DollarSign,
  Heart,
  Package,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useBranches } from "@/hooks/useBranches";
import {
  useSubUsers,
  useSubUsersLimit,
  useCreateSubUser,
  useUpdateSubUser,
  useDeleteSubUser,
  SubUser,
  SubUserPermissions,
} from "@/hooks/useSubUsers";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const defaultPermissions: SubUserPermissions = {
  can_see_prices: true,
  can_see_favorite_suppliers_only: false,
  can_see_favorite_products_only: false,
  can_edit_order: false,
  can_cancel_order: false,
  can_approve_order: true,
  can_see_order_totals: true,
};

const permissionLabels: Record<keyof SubUserPermissions, { label: string; icon: any; description: string }> = {
  can_see_prices: {
    label: "رؤية الأسعار",
    icon: DollarSign,
    description: "إظهار أسعار المنتجات للمستخدم",
  },
  can_see_favorite_suppliers_only: {
    label: "رؤية الموردين المفضلين فقط",
    icon: Heart,
    description: "عرض الموردين الموجودين في المفضلة فقط",
  },
  can_see_favorite_products_only: {
    label: "رؤية المنتجات المفضلة فقط",
    icon: Heart,
    description: "عرض المنتجات الموجودة في المفضلة فقط",
  },
  can_edit_order: {
    label: "تعديل الطلب",
    icon: Pencil,
    description: "السماح بتعديل الطلبات المعلقة",
  },
  can_cancel_order: {
    label: "إلغاء الطلب",
    icon: XCircle,
    description: "السماح بإلغاء الطلبات",
  },
  can_approve_order: {
    label: "الموافقة على الطلب",
    icon: CheckCircle,
    description: "السماح بإرسال الطلبات مباشرة للموردين",
  },
  can_see_order_totals: {
    label: "رؤية إجمالي الطلب",
    icon: Package,
    description: "إظهار إجمالي الطلب والتكلفة",
  },
};

const SubUsers = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const { toast } = useToast();

  const { data: subUsers, isLoading: usersLoading } = useSubUsers();
  const { data: limits, isLoading: limitsLoading } = useSubUsersLimit();
  const { data: branches } = useBranches();
  const createSubUser = useCreateSubUser();
  const updateSubUser = useUpdateSubUser();
  const deleteSubUser = useDeleteSubUser();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SubUser | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<SubUser | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    permissions: { ...defaultPermissions },
    branch_ids: [] as string[],
  });

  // التحقق من صلاحية الوصول
  if (userRole !== "restaurant") {
    navigate("/");
    return null;
  }

  const isLoading = usersLoading || limitsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!limits?.canManage) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">ميزة غير متاحة</h2>
              <p className="text-muted-foreground">
                ميزة إدارة المستخدمين غير مفعلة في اشتراكك الحالي.
                يرجى التواصل مع الإدارة لتفعيل هذه الميزة.
              </p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const canAddMore = limits.currentCount < limits.maxUsers;
  const usagePercent = (limits.currentCount / limits.maxUsers) * 100;

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      full_name: "",
      phone: "",
      permissions: { ...defaultPermissions },
      branch_ids: [],
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const handleOpenEdit = (user: SubUser) => {
    setSelectedUser(user);
    setFormData({
      email: "",
      password: "",
      full_name: user.full_name,
      phone: user.phone || "",
      permissions: user.permissions || { ...defaultPermissions },
      branch_ids: user.branches?.map((b) => b.branch_id) || [],
    });
    setIsEditDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!formData.email || !formData.password || !formData.full_name) {
      toast({ title: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }

    if (formData.branch_ids.length === 0) {
      toast({ title: "يرجى اختيار فرع واحد على الأقل", variant: "destructive" });
      return;
    }

    await createSubUser.mutateAsync({
      email: formData.email,
      password: formData.password,
      full_name: formData.full_name,
      phone: formData.phone || undefined,
      permissions: formData.permissions,
      branch_ids: formData.branch_ids,
    });

    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;

    await updateSubUser.mutateAsync({
      sub_user_id: selectedUser.id,
      full_name: formData.full_name,
      phone: formData.phone || undefined,
      permissions: formData.permissions,
      branch_ids: formData.branch_ids,
    });

    setIsEditDialogOpen(false);
    setSelectedUser(null);
  };

  const handleToggleActive = async (user: SubUser) => {
    await updateSubUser.mutateAsync({
      sub_user_id: user.id,
      is_active: !user.is_active,
    });
  };

  const handleDelete = async () => {
    if (!deleteConfirmUser) return;
    await deleteSubUser.mutateAsync(deleteConfirmUser.id);
    setDeleteConfirmUser(null);
  };

  const toggleBranch = (branchId: string) => {
    setFormData((prev) => ({
      ...prev,
      branch_ids: prev.branch_ids.includes(branchId)
        ? prev.branch_ids.filter((id) => id !== branchId)
        : [...prev.branch_ids, branchId],
    }));
  };

  const togglePermission = (key: keyof SubUserPermissions) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key],
      },
    }));
  };

  const renderPermissionForm = () => (
    <div className="space-y-3">
      <Label className="text-base font-medium">الصلاحيات</Label>
      <div className="grid gap-3">
        {(Object.keys(permissionLabels) as (keyof SubUserPermissions)[]).map((key) => {
          const { label, icon: Icon, description } = permissionLabels[key];
          return (
            <div
              key={key}
              className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                id={key}
                checked={formData.permissions[key]}
                onCheckedChange={() => togglePermission(key)}
              />
              <div className="flex-1">
                <label htmlFor={key} className="flex items-center gap-2 font-medium cursor-pointer">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  {label}
                </label>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderBranchSelector = () => (
    <div className="space-y-3">
      <Label className="text-base font-medium flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        الفروع المسموح بها *
      </Label>
      {branches && branches.length > 0 ? (
        <div className="grid gap-2">
          {branches.map((branch) => {
            const isSelected = formData.branch_ids.includes(branch.id);
            return (
            <div
              key={branch.id}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                isSelected
                  ? "bg-accent border-primary"
                  : "hover:bg-muted/50"
              }`}
              onClick={() => toggleBranch(branch.id)}
            >
              <Checkbox checked={isSelected} />
              <div>
                <span className="font-medium">{branch.name}</span>
                {branch.address && (
                  <p className="text-sm text-muted-foreground">{branch.address}</p>
                )}
              </div>
              {branch.is_default && (
                <Badge variant="secondary" className="mr-auto">
                  الافتراضي
                </Badge>
              )}
            </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-4 text-muted-foreground border rounded-lg">
          لا توجد فروع. يرجى إضافة فروع أولاً.
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>
                <p className="text-muted-foreground">
                  إضافة وإدارة مستخدمين فرعيين للمطعم
                </p>
              </div>
            </div>
            <Button onClick={handleOpenCreate} disabled={!canAddMore}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة مستخدم
            </Button>
          </div>

          {/* Usage Stats */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">المستخدمين</span>
                <span className="font-medium">
                  {limits.currentCount} / {limits.maxUsers}
                </span>
              </div>
              <Progress value={usagePercent} className="h-2" />
              {!canAddMore && (
                <p className="text-sm text-amber-600 mt-2">
                  وصلت للحد الأقصى من المستخدمين. تواصل مع الإدارة لزيادة العدد.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>المستخدمين الفرعيين</CardTitle>
              <CardDescription>
                المستخدمون الذين يمكنهم الوصول لحساب المطعم
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subUsers && subUsers.length > 0 ? (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">الاسم</TableHead>
                        <TableHead className="text-right">الهاتف</TableHead>
                        <TableHead className="text-right">الفروع</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subUsers.map((user) => (
                        <TableRow key={user.id} className={!user.is_active ? "opacity-50" : ""}>
                          <TableCell className="font-medium">{user.full_name}</TableCell>
                          <TableCell dir="ltr" className="text-right">
                            {user.phone || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {user.branches?.map((b) => (
                                <Badge key={b.branch_id} variant="outline" className="text-xs">
                                  {b.branch_name}
                                </Badge>
                              ))}
                              {(!user.branches || user.branches.length === 0) && (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.is_active ? (
                              <Badge className="bg-green-500 text-white">
                                <Power className="w-3 h-3 ml-1" />
                                نشط
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <PowerOff className="w-3 h-3 ml-1" />
                                معطل
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEdit(user)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleActive(user)}
                              >
                                {user.is_active ? (
                                  <PowerOff className="w-4 h-4" />
                                ) : (
                                  <Power className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => setDeleteConfirmUser(user)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>لا يوجد مستخدمين فرعيين</p>
                  <Button variant="outline" className="mt-4" onClick={handleOpenCreate}>
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة أول مستخدم
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة مستخدم جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">الاسم الكامل *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="اسم المستخدم"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="05xxxxxxxx"
                  dir="ltr"
                />
              </div>
            </div>

            {renderBranchSelector()}
            {renderPermissionForm()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleCreate} disabled={createSubUser.isPending}>
              {createSubUser.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              إضافة المستخدم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل المستخدم: {selectedUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit_full_name">الاسم الكامل *</Label>
                <Input
                  id="edit_full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_phone">رقم الهاتف</Label>
                <Input
                  id="edit_phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  dir="ltr"
                />
              </div>
            </div>

            {renderBranchSelector()}
            {renderPermissionForm()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdate} disabled={updateSubUser.isPending}>
              {updateSubUser.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmUser} onOpenChange={() => setDeleteConfirmUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المستخدم</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المستخدم "{deleteConfirmUser?.full_name}"؟
              لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
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

export default SubUsers;

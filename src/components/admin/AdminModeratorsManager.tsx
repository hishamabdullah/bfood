import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Shield, Search, Pencil, Trash2, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

interface AdminPermissions {
  id: string;
  user_id: string;
  can_manage_users: boolean;
  can_manage_orders: boolean;
  can_manage_delivery: boolean;
  can_manage_products: boolean;
  created_at: string;
  profile?: {
    full_name: string;
    business_name: string;
  };
}

const useAdminsList = () => {
  return useQuery({
    queryKey: ["admins-list"],
    queryFn: async () => {
      // جلب المستخدمين ذوي دور المدير
      const { data: adminRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (rolesError) throw rolesError;
      if (!adminRoles || adminRoles.length === 0) return [];

      const adminUserIds = adminRoles.map(r => r.user_id);

      // جلب الملفات الشخصية
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, business_name, created_at")
        .in("user_id", adminUserIds);

      // جلب الصلاحيات
      const { data: permissions } = await supabase
        .from("admin_permissions")
        .select("*")
        .in("user_id", adminUserIds);

      // دمج البيانات
      return adminUserIds.map(userId => {
        const profile = profiles?.find(p => p.user_id === userId);
        const perms = permissions?.find(p => p.user_id === userId);
        return {
          user_id: userId,
          full_name: profile?.full_name || "غير معروف",
          business_name: profile?.business_name || "",
          created_at: profile?.created_at || new Date().toISOString(),
          can_manage_users: perms?.can_manage_users || false,
          can_manage_orders: perms?.can_manage_orders || false,
          can_manage_delivery: perms?.can_manage_delivery || false,
          can_manage_products: perms?.can_manage_products || false,
          permissions_id: perms?.id,
        };
      });
    },
  });
};

const useCreateAdmin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      fullName: string;
      permissions: {
        users: boolean;
        orders: boolean;
        delivery: boolean;
        products: boolean;
      };
    }) => {
      const { data: result, error } = await supabase.functions.invoke("admin-create-user", {
        body: data,
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins-list"] });
      toast.success("تم إنشاء المشرف بنجاح");
    },
    onError: (error: Error) => {
      toast.error(error.message || "حدث خطأ أثناء إنشاء المشرف");
    },
  });
};

const useUpdateAdminPermissions = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      userId: string;
      permissions: {
        users: boolean;
        orders: boolean;
        delivery: boolean;
        products: boolean;
      };
    }) => {
      // تحقق إذا كان السجل موجود
      const { data: existing } = await supabase
        .from("admin_permissions")
        .select("id")
        .eq("user_id", data.userId)
        .single();

      if (existing) {
        // تحديث
        const { error } = await supabase
          .from("admin_permissions")
          .update({
            can_manage_users: data.permissions.users,
            can_manage_orders: data.permissions.orders,
            can_manage_delivery: data.permissions.delivery,
            can_manage_products: data.permissions.products,
          })
          .eq("user_id", data.userId);

        if (error) throw error;
      } else {
        // إضافة جديد
        const { error } = await supabase
          .from("admin_permissions")
          .insert({
            user_id: data.userId,
            can_manage_users: data.permissions.users,
            can_manage_orders: data.permissions.orders,
            can_manage_delivery: data.permissions.delivery,
            can_manage_products: data.permissions.products,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins-list"] });
      toast.success("تم تحديث الصلاحيات");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث الصلاحيات");
    },
  });
};

const AdminModeratorsManager = () => {
  const { data: admins, isLoading } = useAdminsList();
  const createAdmin = useCreateAdmin();
  const updatePermissions = useUpdateAdminPermissions();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<typeof admins extends (infer T)[] ? T : never | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
  });
  
  const [permissions, setPermissions] = useState({
    users: false,
    orders: false,
    delivery: false,
    products: false,
  });

  const filteredAdmins = admins?.filter(admin => {
    const query = searchQuery.toLowerCase();
    return admin.full_name.toLowerCase().includes(query) ||
      admin.business_name.toLowerCase().includes(query);
  }) || [];

  const resetForm = () => {
    setFormData({ email: "", password: "", fullName: "" });
    setPermissions({ users: false, orders: false, delivery: false, products: false });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createAdmin.mutateAsync({
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
      permissions,
    });

    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleOpenEdit = (admin: typeof filteredAdmins[0]) => {
    setEditingAdmin(admin);
    setPermissions({
      users: admin.can_manage_users,
      orders: admin.can_manage_orders,
      delivery: admin.can_manage_delivery,
      products: admin.can_manage_products,
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;

    await updatePermissions.mutateAsync({
      userId: editingAdmin.user_id,
      permissions,
    });

    setEditingAdmin(null);
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
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              إدارة المشرفين ({filteredAdmins.length})
            </CardTitle>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <UserPlus className="h-4 w-4 ml-2" />
              إضافة مشرف جديد
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* شريط البحث */}
          <div className="relative mb-4">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="ابحث بالاسم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>

          {/* جدول المشرفين */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">الصلاحيات</TableHead>
                  <TableHead className="text-right">تاريخ الإضافة</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdmins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      لا يوجد مشرفين
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAdmins.map((admin) => (
                    <TableRow key={admin.user_id}>
                      <TableCell className="font-medium">{admin.full_name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {admin.can_manage_users && (
                            <Badge variant="secondary" className="text-xs">المستخدمين</Badge>
                          )}
                          {admin.can_manage_orders && (
                            <Badge variant="secondary" className="text-xs">الطلبات</Badge>
                          )}
                          {admin.can_manage_delivery && (
                            <Badge variant="secondary" className="text-xs">التوصيل</Badge>
                          )}
                          {admin.can_manage_products && (
                            <Badge variant="secondary" className="text-xs">المنتجات</Badge>
                          )}
                          {!admin.can_manage_users && !admin.can_manage_orders && 
                           !admin.can_manage_delivery && !admin.can_manage_products && (
                            <span className="text-muted-foreground text-sm">بدون صلاحيات محددة</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(admin.created_at), "dd MMM yyyy", { locale: ar })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(admin)}
                          title="تعديل الصلاحيات"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* نافذة إضافة مشرف جديد */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              إضافة مشرف جديد
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <Label htmlFor="admin-email">البريد الإلكتروني</Label>
              <Input
                id="admin-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                dir="ltr"
              />
            </div>

            <div>
              <Label htmlFor="admin-password">كلمة المرور</Label>
              <Input
                id="admin-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                dir="ltr"
              />
            </div>

            <div>
              <Label htmlFor="admin-fullName">الاسم الكامل</Label>
              <Input
                id="admin-fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-3">
              <Label>الصلاحيات</Label>
              <div className="space-y-2 border rounded-lg p-3">
                <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-muted/50">
                  <Checkbox
                    checked={permissions.users}
                    onCheckedChange={(checked) => setPermissions({ ...permissions, users: !!checked })}
                  />
                  <div>
                    <p className="font-medium">إدارة المستخدمين</p>
                    <p className="text-xs text-muted-foreground">الموافقة على الحسابات، تعديل البيانات</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-muted/50">
                  <Checkbox
                    checked={permissions.orders}
                    onCheckedChange={(checked) => setPermissions({ ...permissions, orders: !!checked })}
                  />
                  <div>
                    <p className="font-medium">إدارة الطلبات</p>
                    <p className="text-xs text-muted-foreground">تغيير حالة الطلبات، عرض التفاصيل</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-muted/50">
                  <Checkbox
                    checked={permissions.delivery}
                    onCheckedChange={(checked) => setPermissions({ ...permissions, delivery: !!checked })}
                  />
                  <div>
                    <p className="font-medium">طلبات التوصيل</p>
                    <p className="text-xs text-muted-foreground">متابعة التوصيل، التحقق من الدفع</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-muted/50">
                  <Checkbox
                    checked={permissions.products}
                    onCheckedChange={(checked) => setPermissions({ ...permissions, products: !!checked })}
                  />
                  <div>
                    <p className="font-medium">إدارة المنتجات والتصنيفات</p>
                    <p className="text-xs text-muted-foreground">تعديل المنتجات، إدارة التصنيفات</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>
                إلغاء
              </Button>
              <Button type="submit" disabled={createAdmin.isPending}>
                {createAdmin.isPending && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                إنشاء المشرف
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* نافذة تعديل الصلاحيات */}
      <Dialog open={!!editingAdmin} onOpenChange={() => setEditingAdmin(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل صلاحيات {editingAdmin?.full_name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-3">
              <Label>الصلاحيات</Label>
              <div className="space-y-2 border rounded-lg p-3">
                <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-muted/50">
                  <Checkbox
                    checked={permissions.users}
                    onCheckedChange={(checked) => setPermissions({ ...permissions, users: !!checked })}
                  />
                  <div>
                    <p className="font-medium">إدارة المستخدمين</p>
                    <p className="text-xs text-muted-foreground">الموافقة على الحسابات، تعديل البيانات</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-muted/50">
                  <Checkbox
                    checked={permissions.orders}
                    onCheckedChange={(checked) => setPermissions({ ...permissions, orders: !!checked })}
                  />
                  <div>
                    <p className="font-medium">إدارة الطلبات</p>
                    <p className="text-xs text-muted-foreground">تغيير حالة الطلبات، عرض التفاصيل</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-muted/50">
                  <Checkbox
                    checked={permissions.delivery}
                    onCheckedChange={(checked) => setPermissions({ ...permissions, delivery: !!checked })}
                  />
                  <div>
                    <p className="font-medium">طلبات التوصيل</p>
                    <p className="text-xs text-muted-foreground">متابعة التوصيل، التحقق من الدفع</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-muted/50">
                  <Checkbox
                    checked={permissions.products}
                    onCheckedChange={(checked) => setPermissions({ ...permissions, products: !!checked })}
                  />
                  <div>
                    <p className="font-medium">إدارة المنتجات والتصنيفات</p>
                    <p className="text-xs text-muted-foreground">تعديل المنتجات، إدارة التصنيفات</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setEditingAdmin(null)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={updatePermissions.isPending}>
                {updatePermissions.isPending && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                حفظ التغييرات
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminModeratorsManager;

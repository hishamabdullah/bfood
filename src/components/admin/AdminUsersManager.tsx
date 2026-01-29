import { useState } from "react";
import i18n from "i18next";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Loader2, Plus, Store, Truck, Search, Pencil, Trash2, Mail } from "lucide-react";
import { useAdminUsers, useAdminCreateUser, useAdminUpdateUser, useAdminDeleteUser, useAdminUpdateUserEmail, AdminUser } from "@/hooks/useAdminData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saudiRegions, supplyCategories, getSupplyCategoryName } from "@/data/saudiRegions";

const AdminUsersManager = () => {
  const { data: users, isLoading } = useAdminUsers();
  const createUser = useAdminCreateUser();
  const updateUser = useAdminUpdateUser();
  const deleteUser = useAdminDeleteUser();
  const updateUserEmail = useAdminUpdateUserEmail();

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editingEmailUser, setEditingEmailUser] = useState<AdminUser | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<"restaurant" | "supplier">("restaurant");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    businessName: "",
    phone: "",
    region: "",
  });

  // تصفية المستخدمين حسب البحث والنوع
  const filterUsers = (role: string) => {
    return users?.filter(user => {
      const matchesRole = user.role === role;
      const query = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === "" || 
        user.phone?.includes(searchQuery) ||
        user.full_name?.toLowerCase().includes(query) ||
        user.business_name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query);
      return matchesRole && matchesSearch;
    }) || [];
  };

  const restaurants = filterUsers("restaurant");
  const suppliers = filterUsers("supplier");

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      fullName: "",
      businessName: "",
      phone: "",
      region: "",
    });
    setSelectedCategories([]);
  };

  const handleOpenCreate = (role: "restaurant" | "supplier") => {
    setSelectedRole(role);
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const handleOpenEdit = (user: AdminUser) => {
    setEditingUser(user);
    setFormData({
      email: "",
      password: "",
      fullName: user.full_name,
      businessName: user.business_name,
      phone: user.phone || "",
      region: user.region || "",
    });
    setSelectedCategories(user.supply_categories || []);
  };

  const handleOpenEditEmail = (user: AdminUser) => {
    setEditingEmailUser(user);
    setNewEmail(user.email || "");
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await createUser.mutateAsync({
      ...formData,
      role: selectedRole,
      region: selectedRole === "supplier" ? formData.region : undefined,
      supplyCategories: selectedRole === "supplier" ? selectedCategories : undefined,
    });

    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    await updateUser.mutateAsync({
      userId: editingUser.user_id,
      fullName: formData.fullName,
      businessName: formData.businessName,
      phone: formData.phone,
      region: formData.region || undefined,
      supplyCategories: editingUser.role === "supplier" ? selectedCategories : undefined,
    });

    setEditingUser(null);
    resetForm();
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmailUser) return;

    await updateUserEmail.mutateAsync({
      userId: editingEmailUser.user_id,
      newEmail,
    });

    setEditingEmailUser(null);
    setNewEmail("");
  };

  const handleDelete = async (userId: string) => {
    await deleteUser.mutateAsync(userId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderUserTable = (usersList: AdminUser[], role: "restaurant" | "supplier") => (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {role === "restaurant" ? (
            <span className="flex items-center gap-2">
              <Store className="h-5 w-5 text-blue-600" />
              المطاعم ({usersList.length})
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-orange-600" />
              الموردين ({usersList.length})
            </span>
          )}
        </h3>
        <Button onClick={() => handleOpenCreate(role)} size="sm">
          <Plus className="h-4 w-4 ml-2" />
          إضافة {role === "restaurant" ? "مطعم" : "مورد"}
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الاسم</TableHead>
              <TableHead className="text-right">المنشأة</TableHead>
              <TableHead className="text-right">البريد الإلكتروني</TableHead>
              <TableHead className="text-right">الهاتف</TableHead>
              {role === "supplier" && <TableHead className="text-right">المنطقة</TableHead>}
              <TableHead className="text-right">تاريخ التسجيل</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={role === "supplier" ? 7 : 6} className="text-center text-muted-foreground py-8">
                  لا توجد نتائج
                </TableCell>
              </TableRow>
            ) : (
              usersList.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell>{user.business_name}</TableCell>
                  <TableCell dir="ltr" className="text-right text-sm text-muted-foreground">{user.email || "-"}</TableCell>
                  <TableCell dir="ltr" className="text-right">{user.phone || "-"}</TableCell>
                  {role === "supplier" && <TableCell>{user.region || "-"}</TableCell>}
                  <TableCell>
                    {format(new Date(user.created_at), "dd MMM yyyy", { locale: ar })}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(user)}
                        title="تعديل البيانات"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEditEmail(user)}
                        title="تغيير البريد الإلكتروني"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف المستخدم</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من حذف "{user.business_name}"؟ سيتم حذف جميع بياناته ولا يمكن التراجع عن هذا الإجراء.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(user.user_id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* شريط البحث */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="ابحث برقم الهاتف أو البريد أو اسم المنشأة..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* تبويبات المطاعم والموردين */}
      <Tabs defaultValue="restaurants" className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="restaurants" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            المطاعم ({restaurants.length})
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            الموردين ({suppliers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="restaurants">
          {renderUserTable(restaurants, "restaurant")}
        </TabsContent>

        <TabsContent value="suppliers">
          {renderUserTable(suppliers, "supplier")}
        </TabsContent>
      </Tabs>

      {/* نافذة إضافة مستخدم جديد */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              إضافة {selectedRole === "restaurant" ? "مطعم" : "مورد"} جديد
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <div>
              <Label htmlFor="fullName">الاسم الكامل</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="businessName">اسم المنشأة</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">رقم الجوال</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            {selectedRole === "supplier" && (
              <>
                <div>
                  <Label htmlFor="region">المنطقة</Label>
                  <Select
                    value={formData.region}
                    onValueChange={(value) => setFormData({ ...formData, region: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المنطقة" />
                    </SelectTrigger>
                    <SelectContent>
                      {saudiRegions.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>مجالات التوريد</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                    {supplyCategories.map((category) => (
                      <div key={category.name} className="flex items-center gap-2">
                        <Checkbox
                          id={`create-${category.name}`}
                          checked={selectedCategories.includes(category.name)}
                          onCheckedChange={() => handleCategoryToggle(category.name)}
                        />
                        <Label htmlFor={`create-${category.name}`} className="text-sm cursor-pointer">
                          {getSupplyCategoryName(category, i18n.language)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                إضافة
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* نافذة تعديل المستخدم */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل بيانات {editingUser?.business_name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-fullName">الاسم الكامل</Label>
              <Input
                id="edit-fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-businessName">اسم المنشأة</Label>
              <Input
                id="edit-businessName"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-phone">رقم الجوال</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            {editingUser?.role === "supplier" && (
              <>
                <div>
                  <Label htmlFor="edit-region">المنطقة</Label>
                  <Select
                    value={formData.region}
                    onValueChange={(value) => setFormData({ ...formData, region: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المنطقة" />
                    </SelectTrigger>
                    <SelectContent>
                      {saudiRegions.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>مجالات التوريد</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                    {supplyCategories.map((category) => (
                      <div key={category.name} className="flex items-center gap-2">
                        <Checkbox
                          id={`edit-${category.name}`}
                          checked={selectedCategories.includes(category.name)}
                          onCheckedChange={() => handleCategoryToggle(category.name)}
                        />
                        <Label htmlFor={`edit-${category.name}`} className="text-sm cursor-pointer">
                          {getSupplyCategoryName(category, i18n.language)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={updateUser.isPending}>
                {updateUser.isPending && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                حفظ التعديلات
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* نافذة تغيير البريد الإلكتروني */}
      <Dialog open={!!editingEmailUser} onOpenChange={() => setEditingEmailUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تغيير البريد الإلكتروني</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateEmail} className="space-y-4">
            <div>
              <Label className="text-muted-foreground text-sm">المستخدم</Label>
              <p className="font-medium">{editingEmailUser?.business_name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">البريد الحالي</Label>
              <p className="font-medium" dir="ltr">{editingEmailUser?.email || "-"}</p>
            </div>
            <div>
              <Label htmlFor="newEmail">البريد الإلكتروني الجديد</Label>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                dir="ltr"
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setEditingEmailUser(null)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={updateUserEmail.isPending}>
                {updateUserEmail.isPending && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                تحديث البريد
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsersManager;

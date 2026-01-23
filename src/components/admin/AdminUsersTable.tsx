import { useState } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Loader2, Plus, Store, Truck, Shield } from "lucide-react";
import { useAdminUsers, useAdminCreateUser } from "@/hooks/useAdminData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saudiRegions, supplyCategories } from "@/data/saudiRegions";


const roleIcons: Record<string, React.ReactNode> = {
  restaurant: <Store className="h-4 w-4" />,
  supplier: <Truck className="h-4 w-4" />,
  admin: <Shield className="h-4 w-4" />,
};

const roleLabels: Record<string, string> = {
  restaurant: "مطعم",
  supplier: "مورد",
  admin: "مدير",
};

const roleColors: Record<string, string> = {
  restaurant: "bg-blue-100 text-blue-800",
  supplier: "bg-orange-100 text-orange-800",
  admin: "bg-purple-100 text-purple-800",
};

const AdminUsersTable = () => {
  const { data: users, isLoading } = useAdminUsers();
  const createUser = useAdminCreateUser();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await createUser.mutateAsync({
      ...formData,
      role: selectedRole,
      region: selectedRole === "supplier" ? formData.region : undefined,
      supplyCategories: selectedRole === "supplier" ? selectedCategories : undefined,
    });

    setIsDialogOpen(false);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="text-lg font-semibold">جميع المستخدمين ({users?.length || 0})</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              تسجيل مستخدم
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>تسجيل مستخدم جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* نوع الحساب */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={selectedRole === "restaurant" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setSelectedRole("restaurant")}
                >
                  <Store className="h-4 w-4 ml-2" />
                  مطعم
                </Button>
                <Button
                  type="button"
                  variant={selectedRole === "supplier" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setSelectedRole("supplier")}
                >
                  <Truck className="h-4 w-4 ml-2" />
                  مورد
                </Button>
              </div>

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

              {/* حقول المورد الإضافية */}
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
                        <div key={category} className="flex items-center gap-2">
                          <Checkbox
                            id={category}
                            checked={selectedCategories.includes(category)}
                            onCheckedChange={() => handleCategoryToggle(category)}
                          />
                          <Label htmlFor={category} className="text-sm cursor-pointer">
                            {category}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={createUser.isPending}>
                  {createUser.isPending && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                  تسجيل
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الاسم</TableHead>
              <TableHead className="text-right">المنشأة</TableHead>
              <TableHead className="text-right">الهاتف</TableHead>
              <TableHead className="text-right">النوع</TableHead>
              <TableHead className="text-right">المنطقة</TableHead>
              <TableHead className="text-right">تاريخ التسجيل</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.full_name}</TableCell>
                <TableCell>{user.business_name}</TableCell>
                <TableCell dir="ltr" className="text-right">{user.phone || "-"}</TableCell>
                <TableCell>
                  <Badge className={`flex items-center gap-1 w-fit ${roleColors[user.role || ""] || "bg-gray-100"}`}>
                    {roleIcons[user.role || ""]}
                    {roleLabels[user.role || ""] || user.role}
                  </Badge>
                </TableCell>
                <TableCell>{user.region || "-"}</TableCell>
                <TableCell>
                  {format(new Date(user.created_at), "dd MMM yyyy", { locale: ar })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminUsersTable;

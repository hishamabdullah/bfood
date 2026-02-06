import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Search, Clock, CheckCircle, Loader2, Building2, Truck, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserDocumentsDialog from "./UserDocumentsDialog";
import type { AdminUser } from "@/hooks/useAdminData";

interface PendingUser {
  id: string;
  user_id: string;
  full_name: string;
  business_name: string;
  business_name_en?: string | null;
  phone: string | null;
  region: string | null;
  is_approved: boolean;
  created_at: string;
  role?: string;
  email?: string | null;
  commercial_registration_url?: string | null;
  license_url?: string | null;
  tax_certificate_url?: string | null;
  national_address_url?: string | null;
}

const roleLabels: Record<string, string> = {
  restaurant: "مطعم",
  supplier: "مورد",
};

const roleColors: Record<string, string> = {
  restaurant: "bg-blue-100 text-blue-800",
  supplier: "bg-green-100 text-green-800",
};

const AdminApprovalManager = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null);
  const [viewingDocsUser, setViewingDocsUser] = useState<PendingUser | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // جلب المستخدمين مع الإيميل
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["pending-approvals"],
    queryFn: async () => {
      // استخدام Edge Function لجلب المستخدمين مع الإيميل
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        throw new Error("غير مصرح");
      }

      const response = await supabase.functions.invoke("admin-get-users", {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "خطأ في جلب المستخدمين");
      }

      // تصفية المستخدمين غير المدراء
      const allUsers = (response.data || []) as PendingUser[];
      return allUsers.filter(u => u.role !== "admin");
    },
  });

  // الموافقة على المستخدم
  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_approved: true })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "تمت الموافقة على الحساب بنجاح" });
    },
    onError: (error) => {
      toast({ title: "خطأ في الموافقة", description: error.message, variant: "destructive" });
    },
  });

  // إلغاء الموافقة
  const revokeMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_approved: false })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "تم إلغاء الموافقة على الحساب" });
    },
    onError: (error) => {
      toast({ title: "خطأ في إلغاء الموافقة", description: error.message, variant: "destructive" });
    },
  });

  const pendingUsers = users.filter(u => !u.is_approved);
  const approvedUsers = users.filter(u => u.is_approved);

  const filterUsers = (usersList: PendingUser[]) => {
    if (!searchQuery) return usersList;
    const query = searchQuery.toLowerCase();
    return usersList.filter(
      u =>
        u.full_name.toLowerCase().includes(query) ||
        u.business_name.toLowerCase().includes(query) ||
        u.phone?.includes(searchQuery) ||
        u.email?.toLowerCase().includes(query)
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderUserTable = (usersList: PendingUser[], showApproveButton: boolean) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">الاسم</TableHead>
          <TableHead className="text-right">اسم النشاط</TableHead>
          <TableHead className="text-right">البريد الإلكتروني</TableHead>
          <TableHead className="text-right">النوع</TableHead>
          <TableHead className="text-right">الهاتف</TableHead>
          <TableHead className="text-right">المنطقة</TableHead>
          <TableHead className="text-right">تاريخ التسجيل</TableHead>
          <TableHead className="text-right">الإجراءات</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filterUsers(usersList).length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
              لا توجد حسابات
            </TableCell>
          </TableRow>
        ) : (
          filterUsers(usersList).map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.full_name}</TableCell>
              <TableCell>{user.business_name}</TableCell>
              <TableCell dir="ltr" className="text-right text-sm text-muted-foreground">{user.email || "-"}</TableCell>
              <TableCell>
                <Badge className={roleColors[user.role || ""] || "bg-gray-100"}>
                  {user.role === "restaurant" && <Building2 className="w-3 h-3 ml-1" />}
                  {user.role === "supplier" && <Truck className="w-3 h-3 ml-1" />}
                  {roleLabels[user.role || ""] || user.role}
                </Badge>
              </TableCell>
              <TableCell dir="ltr" className="text-right">{user.phone || "-"}</TableCell>
              <TableCell>{user.region || "-"}</TableCell>
              <TableCell>{formatDate(user.created_at)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary"
                    onClick={() => setViewingDocsUser(user)}
                    title="عرض المستندات"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                  {showApproveButton ? (
                    <Button
                      size="sm"
                      onClick={() => approveMutation.mutate(user.user_id)}
                      disabled={approveMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 ml-1" />
                      موافقة
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRejectingUserId(user.user_id)}
                      disabled={revokeMutation.isPending}
                    >
                      <X className="w-4 h-4 ml-1" />
                      إلغاء الموافقة
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">في انتظار الموافقة</CardTitle>
            <Clock className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingUsers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">تمت الموافقة عليهم</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedUsers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* البحث */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="البحث بالاسم أو النشاط أو الهاتف أو البريد..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* تبويبات */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="w-4 h-4" />
            في الانتظار ({pendingUsers.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle className="w-4 h-4" />
            تمت الموافقة ({approvedUsers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {renderUserTable(pendingUsers, true)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {renderUserTable(approvedUsers, false)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* نافذة تأكيد إلغاء الموافقة */}
      <AlertDialog open={!!rejectingUserId} onOpenChange={() => setRejectingUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>إلغاء الموافقة على الحساب</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من إلغاء الموافقة على هذا الحساب؟ لن يتمكن المستخدم من الوصول للنظام.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (rejectingUserId) {
                  revokeMutation.mutate(rejectingUserId);
                  setRejectingUserId(null);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              تأكيد الإلغاء
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Documents Dialog */}
      <UserDocumentsDialog
        user={viewingDocsUser as AdminUser | null}
        open={!!viewingDocsUser}
        onOpenChange={(open) => !open && setViewingDocsUser(null)}
      />
    </div>
  );
};

export default AdminApprovalManager;

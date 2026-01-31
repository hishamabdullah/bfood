import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, ShoppingBag, Users, FolderTree, Loader2, UserCheck, Package, Settings, Tags, Truck, UserCog, Layers } from "lucide-react";
import AdminStatsCards from "@/components/admin/AdminStatsCards";
import AdminOrdersTable from "@/components/admin/AdminOrdersTable";
import AdminCategoriesManager from "@/components/admin/AdminCategoriesManager";
import AdminSubcategoriesManager from "@/components/admin/AdminSubcategoriesManager";
import AdminUsersManager from "@/components/admin/AdminUsersManager";
import AdminApprovalManager from "@/components/admin/AdminApprovalManager";
import AdminProductsManager from "@/components/admin/AdminProductsManager";
import AdminLogoSettings from "@/components/admin/AdminLogoSettings";
import AdminSupplierCategoriesManager from "@/components/admin/AdminSupplierCategoriesManager";
import AdminDeliveryOrders from "@/components/admin/AdminDeliveryOrders";
import AdminModeratorsManager from "@/components/admin/AdminModeratorsManager";

const Admin = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || userRole !== "admin")) {
      navigate("/dashboard");
    }
  }, [user, userRole, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || userRole !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">لوحة تحكم المدير</h1>
            </div>
            <p className="text-muted-foreground">
              إدارة كاملة للنظام - الطلبات والمستخدمين والتصنيفات والمنتجات
            </p>
          </div>

          {/* Stats */}
          <div className="mb-8">
            <AdminStatsCards />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="approvals" className="space-y-6">
            <TabsList className="bg-muted/50 p-1 flex-wrap h-auto gap-1">
              <TabsTrigger value="approvals" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                الموافقات
              </TabsTrigger>
              <TabsTrigger value="delivery" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                طلبات التوصيل
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                المنتجات
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                الطلبات
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                المستخدمين
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex items-center gap-2">
                <FolderTree className="h-4 w-4" />
                تصنيفات المنتجات
              </TabsTrigger>
              <TabsTrigger value="subcategories" className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                الأقسام الفرعية
              </TabsTrigger>
              <TabsTrigger value="supplier-categories" className="flex items-center gap-2">
                <Tags className="h-4 w-4" />
                تصنيفات الموردين
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                الإعدادات
              </TabsTrigger>
              <TabsTrigger value="moderators" className="flex items-center gap-2">
                <UserCog className="h-4 w-4" />
                المشرفين
              </TabsTrigger>
            </TabsList>

            <TabsContent value="approvals">
              <AdminApprovalManager />
            </TabsContent>

            <TabsContent value="delivery">
              <AdminDeliveryOrders />
            </TabsContent>

            <TabsContent value="products">
              <AdminProductsManager />
            </TabsContent>

            <TabsContent value="orders">
              <AdminOrdersTable />
            </TabsContent>

            <TabsContent value="users">
              <AdminUsersManager />
            </TabsContent>

            <TabsContent value="categories">
              <AdminCategoriesManager />
            </TabsContent>

            <TabsContent value="subcategories">
              <AdminSubcategoriesManager />
            </TabsContent>

            <TabsContent value="supplier-categories">
              <AdminSupplierCategoriesManager />
            </TabsContent>

            <TabsContent value="settings">
              <AdminLogoSettings />
            </TabsContent>

            <TabsContent value="moderators">
              <AdminModeratorsManager />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;

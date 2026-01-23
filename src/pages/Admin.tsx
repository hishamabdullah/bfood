import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, ShoppingBag, Users, FolderTree, Loader2 } from "lucide-react";
import AdminStatsCards from "@/components/admin/AdminStatsCards";
import AdminOrdersTable from "@/components/admin/AdminOrdersTable";
import AdminCategoriesManager from "@/components/admin/AdminCategoriesManager";
import AdminUsersManager from "@/components/admin/AdminUsersManager";

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
              إدارة كاملة للنظام - الطلبات والمستخدمين والتصنيفات
            </p>
          </div>

          {/* Stats */}
          <div className="mb-8">
            <AdminStatsCards />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="orders" className="space-y-6">
            <TabsList className="bg-muted/50 p-1">
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
                التصنيفات
              </TabsTrigger>
            </TabsList>

            <TabsContent value="orders">
              <AdminOrdersTable />
            </TabsContent>

            <TabsContent value="users">
              <AdminUsersManager />
            </TabsContent>

            <TabsContent value="categories">
              <AdminCategoriesManager />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;

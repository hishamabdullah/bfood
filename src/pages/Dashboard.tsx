import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  ShoppingBag, 
  TrendingUp, 
  Clock, 
  Plus,
  ArrowLeft,
  Store,
  Truck,
  Loader2
} from "lucide-react";
import { useSupplierStats } from "@/hooks/useSupplierStats";
import { useRestaurantStats } from "@/hooks/useRestaurantStats";

const Dashboard = () => {
  const { user, userRole, profile, loading, isApproved } = useAuth();
  const navigate = useNavigate();
  const { data: supplierStats, isLoading: supplierStatsLoading } = useSupplierStats();
  const { data: restaurantStats, isLoading: restaurantStatsLoading } = useRestaurantStats();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login");
      } else if (!isApproved && userRole !== "admin") {
        navigate("/pending-approval");
      }
    }
  }, [user, loading, isApproved, userRole, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (!isApproved && userRole !== "admin")) {
    return null;
  }

  const isSupplier = userRole === "supplier";
  const isRestaurant = userRole === "restaurant";
  const isAdmin = userRole === "admin";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              {isSupplier ? (
                <Truck className="h-8 w-8 text-primary" />
              ) : (
                <Store className="h-8 w-8 text-primary" />
              )}
              <h1 className="text-3xl font-bold">
                مرحباً، {profile?.full_name || "مستخدم"}
              </h1>
            </div>
            <p className="text-muted-foreground">
              {profile?.business_name} • {isSupplier ? "مورد" : isRestaurant ? "مطعم" : "مدير"}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isSupplier ? "الطلبات الواردة" : "طلباتي"}
                  </p>
                  <p className="text-2xl font-bold">
                    {isSupplier ? (supplierStats?.totalOrders || 0) : (restaurantStats?.totalOrders || 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">قيد التنفيذ</p>
                  <p className="text-2xl font-bold">
                    {isSupplier ? (supplierStats?.pendingOrders || 0) : (restaurantStats?.pendingOrders || 0)}
                  </p>
                </div>
              </div>
            </div>

            {isSupplier && (
              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                    <Package className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">منتجاتي</p>
                    <p className="text-2xl font-bold">
                      {supplierStats?.totalProducts || 0}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isSupplier ? "إجمالي المبيعات" : "إجمالي المشتريات"}
                  </p>
                  <p className="text-2xl font-bold">
                    {isSupplier 
                      ? (supplierStats?.totalSales?.toFixed(2) || "0.00") 
                      : (restaurantStats?.totalPurchases?.toFixed(2) || "0.00")
                    } ر.س
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isSupplier ? (
              <>
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="text-lg font-semibold mb-4">إدارة المنتجات</h3>
                  <p className="text-muted-foreground mb-4">
                    أضف منتجات جديدة وحدّث الأسعار والمخزون
                  </p>
                  <Link to="/supplier/products">
                    <Button variant="hero">
                      <Plus className="h-5 w-5" />
                      إضافة منتج جديد
                    </Button>
                  </Link>
                </div>

                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="text-lg font-semibold mb-4">الطلبات الواردة</h3>
                  <p className="text-muted-foreground mb-4">
                    راجع الطلبات الجديدة وحدّث حالتها
                  </p>
                  <Link to="/supplier/orders">
                    <Button variant="outline">
                      عرض الطلبات
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </>
            ) : isRestaurant ? (
              <>
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="text-lg font-semibold mb-4">تصفح المنتجات</h3>
                  <p className="text-muted-foreground mb-4">
                    استعرض المنتجات من جميع الموردين وأضفها للسلة
                  </p>
                  <Link to="/products">
                    <Button variant="hero">
                      تصفح المنتجات
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>

                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="text-lg font-semibold mb-4">طلباتي</h3>
                  <p className="text-muted-foreground mb-4">
                    تابع حالة طلباتك الحالية والسابقة
                  </p>
                  <Link to="/orders">
                    <Button variant="outline">
                      عرض الطلبات
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </>
            ) : null}
          </div>

          {/* Admin Panel Link */}
          {isAdmin && (
            <div className="mt-8 bg-card rounded-2xl border border-border p-6">
              <h3 className="text-lg font-semibold mb-4">لوحة تحكم المدير</h3>
              <p className="text-muted-foreground mb-4">
                إدارة المستخدمين والطلبات والإعدادات
              </p>
              <Link to="/admin">
                <Button variant="hero">
                  الذهاب للوحة التحكم
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;

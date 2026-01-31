import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Package, 
  ShoppingBag, 
  TrendingUp, 
  Clock, 
  Plus,
  ArrowLeft,
  Store,
  Truck,
  Loader2,
  MapPin,
  User as UserIcon,
  Tag,
  Share2,
  Copy,
  Check
} from "lucide-react";
import { useSupplierStats } from "@/hooks/useSupplierStats";
import { useRestaurantStats } from "@/hooks/useRestaurantStats";
import { useSuppliers } from "@/hooks/useSuppliers";
import { saudiRegions, getRegionName } from "@/data/saudiRegions";
import i18n from "i18next";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const { user, userRole, profile, loading, isApproved } = useAuth();
  const navigate = useNavigate();
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [linkCopied, setLinkCopied] = useState(false);
  
  const { data: supplierStats, isLoading: supplierStatsLoading } = useSupplierStats();
  const { data: restaurantStats, isLoading: restaurantStatsLoading } = useRestaurantStats();
  const { data: suppliers, isLoading: suppliersLoading } = useSuppliers(selectedRegion);

  // Get top 6 suppliers for display
  const displayedSuppliers = suppliers?.slice(0, 6) || [];

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login");
      } else if (!isApproved && (userRole === "restaurant" || userRole === "supplier")) {
        // المطاعم والموردين غير المعتمدين يُحوّلون لصفحة الانتظار
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

  if (!user || (!isApproved && userRole === "restaurant")) {
    return null;
  }

  const isSupplier = userRole === "supplier";
  const isRestaurant = userRole === "restaurant";
  const isAdmin = userRole === "admin";

  const storeUrl = user ? `${window.location.origin}/store/${user.id}` : "";

  const copyStoreLink = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

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
                {t("dashboard.welcome")}، {profile?.full_name || t("common.loading")}
              </h1>
            </div>
            <p className="text-muted-foreground">
              {profile?.business_name} • {isSupplier ? t("auth.supplier") : isRestaurant ? t("auth.restaurant") : t("dashboard.admin")}
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
                    {isSupplier ? t("orders.incomingOrders") : t("dashboard.myOrders")}
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
                  <p className="text-sm text-muted-foreground">{t("orders.inProgress")}</p>
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
                    <p className="text-sm text-muted-foreground">{t("dashboard.myProducts")}</p>
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
                    {isSupplier ? t("dashboard.totalSales") : t("dashboard.totalPurchases")}
                  </p>
                  <p className="text-2xl font-bold">
                    {isSupplier 
                      ? (supplierStats?.totalSales?.toFixed(2) || "0.00") 
                      : (restaurantStats?.totalPurchases?.toFixed(2) || "0.00")
                    } {t("common.sar")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isSupplier ? (
              <>
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="text-lg font-semibold mb-4">{t("dashboard.manageProducts")}</h3>
                  <p className="text-muted-foreground mb-4">
                    {t("dashboard.manageProductsDesc")}
                  </p>
                  <Link to="/supplier/products">
                    <Button variant="hero">
                      <Plus className="h-5 w-5" />
                      {t("dashboard.addNewProduct")}
                    </Button>
                  </Link>
                </div>

                <div className="bg-card rounded-2xl border border-border p-6 relative">
                  {/* Badge أحمر للطلبات الجديدة */}
                  {(supplierStats?.newOrders || 0) > 0 && (
                    <div className="absolute -top-2 -end-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[24px] h-6 flex items-center justify-center px-2 shadow-lg animate-pulse">
                      {supplierStats?.newOrders}
                    </div>
                  )}
                  <h3 className="text-lg font-semibold mb-4">{t("orders.incomingOrders")}</h3>
                  <p className="text-muted-foreground mb-4">
                    {t("dashboard.incomingOrdersDesc")}
                  </p>
                  <Link to="/supplier/orders">
                    <Button variant="outline">
                      {t("dashboard.viewOrders")}
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>

                <div className="bg-card rounded-2xl border border-border p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Tag className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">
                      {i18n.language === "ar" ? "الأسعار المخصصة" : "Custom Prices"}
                    </h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    {i18n.language === "ar" ? "خصص أسعار معينة لمطاعم محددة" : "Set custom prices for specific restaurants"}
                  </p>
                  <Link to="/supplier/custom-prices">
                    <Button variant="outline">
                      {i18n.language === "ar" ? "إدارة الأسعار" : "Manage Prices"}
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>

                {/* Share Store Link Card */}
                <div className="bg-card rounded-2xl border border-border p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Share2 className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">
                      {i18n.language === "ar" ? "رابط متجرك" : "Your Store Link"}
                    </h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    {i18n.language === "ar" 
                      ? "شارك هذا الرابط مع عملائك ليتمكنوا من تصفح منتجاتك" 
                      : "Share this link with your customers so they can browse your products"}
                  </p>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-lg text-sm break-all">
                      <span className="flex-1 text-muted-foreground truncate">{storeUrl}</span>
                    </div>
                    <Button variant="outline" onClick={copyStoreLink} className="w-full">
                      {linkCopied ? (
                        <>
                          <Check className="h-4 w-4 text-green-500" />
                          {i18n.language === "ar" ? "تم النسخ!" : "Copied!"}
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          {i18n.language === "ar" ? "نسخ الرابط" : "Copy Link"}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : isRestaurant ? (
              <>
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="text-lg font-semibold mb-4">{t("dashboard.browseProducts")}</h3>
                  <p className="text-muted-foreground mb-4">
                    {t("dashboard.browseProductsDesc")}
                  </p>
                  <Link to="/products">
                    <Button variant="hero">
                      {t("dashboard.browseProducts")}
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>

                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="text-lg font-semibold mb-4">{t("dashboard.myOrders")}</h3>
                  <p className="text-muted-foreground mb-4">
                    {t("dashboard.myOrdersDesc")}
                  </p>
                  <Link to="/orders">
                    <Button variant="outline">
                      {t("dashboard.viewOrders")}
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </>
            ) : null}
          </div>

          {/* Suppliers Section for Restaurants */}
          {isRestaurant && (
            <div className="mt-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold">{t("common.suppliers")}</h2>
                  <p className="text-sm text-muted-foreground">{t("suppliers.selectRegion")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger className="w-[200px]">
                      <MapPin className="h-4 w-4 me-2 text-muted-foreground" />
                      <SelectValue placeholder={t("suppliers.allRegions")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("suppliers.allRegions")}</SelectItem>
                      {saudiRegions.map((region) => (
                        <SelectItem key={region.name} value={region.name}>
                          {getRegionName(region, i18n.language)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Link to="/suppliers">
                    <Button variant="outline" size="sm">
                      {t("common.viewAll")}
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {suppliersLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-card rounded-2xl border border-border p-5 animate-pulse">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-muted" />
                        <div className="flex-1">
                          <div className="h-4 w-24 bg-muted rounded mb-2" />
                          <div className="h-3 w-16 bg-muted rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : displayedSuppliers.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border p-8 text-center">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">{t("suppliers.noSuppliers")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedSuppliers.map((supplier) => (
                    <div
                      key={supplier.id}
                      className="bg-card rounded-2xl border border-border p-5 hover:shadow-card transition-all duration-300"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                          {supplier.avatar_url ? (
                            <img
                              src={supplier.avatar_url}
                              alt={supplier.business_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <UserIcon className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{supplier.business_name}</h3>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{supplier.region || t("common.noResults")}</span>
                          </div>
                        </div>
                      </div>

                      {supplier.supply_categories && supplier.supply_categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {supplier.supply_categories.slice(0, 2).map((cat: string) => (
                            <Badge key={cat} variant="secondary" className="text-xs">
                              {cat}
                            </Badge>
                          ))}
                          {supplier.supply_categories.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{supplier.supply_categories.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Link to={`/products?supplier=${supplier.user_id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Package className="h-4 w-4 me-1" />
                            {t("common.products")} ({supplier.productsCount || 0})
                          </Button>
                        </Link>
                        <Link to={`/profile/${supplier.user_id}`}>
                          <Button variant="ghost" size="icon" className="h-9 w-9">
                            <UserIcon className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Admin Panel Link */}
          {isAdmin && (
            <div className="mt-8 bg-card rounded-2xl border border-border p-6">
              <h3 className="text-lg font-semibold mb-4">{t("dashboard.adminPanel")}</h3>
              <p className="text-muted-foreground mb-4">
                {t("dashboard.adminPanelDesc")}
              </p>
              <Link to="/admin">
                <Button variant="hero">
                  {t("dashboard.goToAdminPanel")}
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

import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useHasFeature } from "@/hooks/useRestaurantAccess";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, TrendingDown, Package, Truck, BarChart3, PieChart, Lock } from "lucide-react";
import { useRestaurantAnalytics } from "@/hooks/useRestaurantAnalytics";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#00875A", "#0070F3", "#F5A623", "#E63946", "#8B5CF6", "#06B6D4", "#EC4899", "#84CC16"];

const Analytics = () => {
  const { t, i18n } = useTranslation();
  const { user, userRole, loading, isApproved } = useAuth();
  const { hasFeature, isLoading: featureLoading } = useHasFeature("can_view_analytics");
  const navigate = useNavigate();
  const { data: analytics, isLoading } = useRestaurantAnalytics(6);

  const isArabic = i18n.language === "ar";
  const dateLocale = isArabic ? ar : enUS;

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login");
      } else if (userRole !== "restaurant") {
        navigate("/dashboard");
      } else if (!isApproved) {
        navigate("/pending-approval");
      }
    }
  }, [user, loading, isApproved, userRole, navigate]);

  if (loading || isLoading || featureLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || userRole !== "restaurant") {
    return null;
  }

  // Show feature disabled message
  if (!hasFeature) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Lock className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{t("subscription.featureDisabled")}</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              {t("subscription.analyticsDisabled")}
            </p>
            <Link to="/dashboard">
              <Button variant="hero">{t("nav.dashboard")}</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return format(date, "MMM", { locale: dateLocale });
  };

  const monthlyChartData = analytics?.monthlySpending.map((item) => ({
    name: formatMonth(item.month),
    amount: item.amount,
  })) || [];

  const supplierPieData = analytics?.supplierBreakdown.slice(0, 6).map((item) => ({
    name: item.supplierName,
    value: item.totalSpent,
  })) || [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">{t("analytics.title")}</h1>
            </div>
            <p className="text-muted-foreground">{t("analytics.description")}</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* This Month Spending */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">{t("analytics.thisMonth")}</p>
                {analytics && analytics.monthlyChange !== 0 && (
                  <div className={`flex items-center gap-1 text-xs font-medium ${
                    analytics.monthlyChange > 0 ? "text-red-500" : "text-green-500"
                  }`}>
                    {analytics.monthlyChange > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(analytics.monthlyChange).toFixed(1)}%
                  </div>
                )}
              </div>
              <p className="text-2xl font-bold text-primary">
                {analytics?.totalSpentThisMonth.toFixed(2) || "0.00"} <span className="text-base font-normal">{t("common.sar")}</span>
              </p>
            </div>

            {/* Last Month */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <p className="text-sm text-muted-foreground mb-2">{t("analytics.lastMonth")}</p>
              <p className="text-2xl font-bold">
                {analytics?.totalSpentLastMonth.toFixed(2) || "0.00"} <span className="text-base font-normal text-muted-foreground">{t("common.sar")}</span>
              </p>
            </div>

            {/* Top Products Count */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{t("analytics.productsOrdered")}</p>
              </div>
              <p className="text-2xl font-bold">{analytics?.topProducts.length || 0}</p>
            </div>

            {/* Suppliers Count */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{t("analytics.suppliersUsed")}</p>
              </div>
              <p className="text-2xl font-bold">{analytics?.supplierBreakdown.length || 0}</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Monthly Spending Chart */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                {t("analytics.monthlySpending")}
              </h3>
              {monthlyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value.toFixed(2)} ${t("common.sar")}`, t("analytics.spending")]}
                    />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  {t("analytics.noData")}
                </div>
              )}
            </div>

            {/* Supplier Distribution */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                {t("analytics.supplierDistribution")}
              </h3>
              {supplierPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={supplierPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {supplierPieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value.toFixed(2)} ${t("common.sar")}`, t("analytics.spending")]}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  {t("analytics.noData")}
                </div>
              )}
            </div>
          </div>

          {/* Top Products Table */}
          <div className="bg-card rounded-2xl border border-border p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              {t("analytics.topProducts")}
            </h3>
            {analytics?.topProducts && analytics.topProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-start py-3 px-2 text-sm font-medium text-muted-foreground">{t("analytics.product")}</th>
                      <th className="text-start py-3 px-2 text-sm font-medium text-muted-foreground">{t("analytics.quantity")}</th>
                      <th className="text-start py-3 px-2 text-sm font-medium text-muted-foreground">{t("analytics.totalSpent")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topProducts.map((product, index) => (
                      <tr key={product.productId} className="border-b border-border/50 last:border-0">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-muted-foreground w-6">
                              #{index + 1}
                            </span>
                            <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0">
                              {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.productName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <span className="font-medium">{product.productName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">{product.totalQuantity}</td>
                        <td className="py-3 px-2 font-medium">{product.totalSpent.toFixed(2)} {t("common.sar")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                {t("analytics.noData")}
              </div>
            )}
          </div>

          {/* Supplier Breakdown Table */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              {t("analytics.supplierBreakdown")}
            </h3>
            {analytics?.supplierBreakdown && analytics.supplierBreakdown.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-start py-3 px-2 text-sm font-medium text-muted-foreground">{t("analytics.supplier")}</th>
                      <th className="text-start py-3 px-2 text-sm font-medium text-muted-foreground">{t("analytics.ordersCount")}</th>
                      <th className="text-start py-3 px-2 text-sm font-medium text-muted-foreground">{t("analytics.totalSpent")}</th>
                      <th className="text-start py-3 px-2 text-sm font-medium text-muted-foreground">{t("analytics.percentage")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.supplierBreakdown.map((supplier, index) => {
                      const totalSpent = analytics.supplierBreakdown.reduce((sum, s) => sum + s.totalSpent, 0);
                      const percentage = totalSpent > 0 ? (supplier.totalSpent / totalSpent) * 100 : 0;
                      return (
                        <tr key={supplier.supplierId} className="border-b border-border/50 last:border-0">
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              <span className="font-medium">{supplier.supplierName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-muted-foreground">{supplier.ordersCount}</td>
                          <td className="py-3 px-2 font-medium">{supplier.totalSpent.toFixed(2)} {t("common.sar")}</td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[100px]">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${percentage}%`,
                                    backgroundColor: COLORS[index % COLORS.length],
                                  }}
                                />
                              </div>
                              <span className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                {t("analytics.noData")}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Analytics;

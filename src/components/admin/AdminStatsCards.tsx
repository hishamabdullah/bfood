import { ShoppingBag, Package, Store, Truck, TrendingUp, Loader2 } from "lucide-react";
import { useAdminStats } from "@/hooks/useAdminData";

const AdminStatsCards = () => {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    {
      title: "إجمالي الطلبات",
      value: stats?.ordersCount || 0,
      icon: ShoppingBag,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "المنتجات",
      value: stats?.productsCount || 0,
      icon: Package,
      color: "bg-secondary/20 text-secondary",
    },
    {
      title: "المطاعم",
      value: stats?.restaurantsCount || 0,
      icon: Store,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "الموردين",
      value: stats?.suppliersCount || 0,
      icon: Truck,
      color: "bg-orange-100 text-orange-600",
    },
    {
      title: "إجمالي المبيعات",
      value: `${stats?.totalSales?.toFixed(2) || "0.00"} ر.س`,
      icon: TrendingUp,
      color: "bg-green-100 text-green-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {statCards.map((stat, index) => (
        <div key={index} className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminStatsCards;

import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Tag,
  Loader2,
  ArrowRight,
  Users,
} from "lucide-react";
import { useSupplierCustomPrices } from "@/hooks/useCustomPrices";
import RestaurantCustomPriceCard from "@/components/supplier/RestaurantCustomPriceCard";
import AddRestaurantDialog from "@/components/supplier/AddRestaurantDialog";

interface RestaurantGroup {
  restaurantId: string;
  businessName: string;
  fullName: string;
  customerCode?: string;
  productCount: number;
}

export default function SupplierCustomPrices() {
  const { t } = useTranslation();
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const { data: customPrices, isLoading } = useSupplierCustomPrices();

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // تجميع الأسعار حسب المطعم
  const restaurantGroups = useMemo(() => {
    if (!customPrices) return [];
    
    const groupMap = new Map<string, RestaurantGroup>();
    
    customPrices.forEach(cp => {
      const existing = groupMap.get(cp.restaurant_id);
      if (existing) {
        existing.productCount++;
      } else {
        groupMap.set(cp.restaurant_id, {
          restaurantId: cp.restaurant_id,
          businessName: cp.restaurant_profile?.business_name || "",
          fullName: cp.restaurant_profile?.full_name || "",
          customerCode: cp.restaurant_profile?.customer_code,
          productCount: 1,
        });
      }
    });
    
    return Array.from(groupMap.values());
  }, [customPrices]);

  // فلترة المطاعم حسب البحث
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return restaurantGroups;
    const query = searchQuery.toLowerCase();
    return restaurantGroups.filter(g =>
      g.businessName.toLowerCase().includes(query) ||
      g.fullName.toLowerCase().includes(query) ||
      g.customerCode?.includes(searchQuery)
    );
  }, [restaurantGroups, searchQuery]);

  // قائمة المطاعم الموجودة
  const existingRestaurantIds = useMemo(() => {
    return restaurantGroups.map(g => g.restaurantId);
  }, [restaurantGroups]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || userRole !== "supplier") {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <Link
                to="/dashboard"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
              >
                <ArrowRight className="h-4 w-4 ms-1 rtl:rotate-180" />
                العودة للوحة التحكم
              </Link>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Tag className="h-7 w-7 text-primary" />
                الأسعار المخصصة
              </h1>
              <p className="text-muted-foreground">
                {restaurantGroups.length} مطعم • {customPrices?.length || 0} سعر مخصص
              </p>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-5 w-5" />
              إضافة مطعم
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="البحث بالمطعم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-10"
            />
          </div>

          {/* Restaurant Cards */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border">
              <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد أسعار مخصصة</h3>
              <p className="text-muted-foreground mb-4">
                اختر مطعم وأضف له منتجات بأسعار مخصصة
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-5 w-5" />
                إضافة مطعم
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredGroups.map((group) => (
                <RestaurantCustomPriceCard
                  key={group.restaurantId}
                  restaurantId={group.restaurantId}
                  businessName={group.businessName}
                  fullName={group.fullName}
                  customerCode={group.customerCode}
                  productCount={group.productCount}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Add Restaurant Dialog */}
      <AddRestaurantDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        existingRestaurantIds={existingRestaurantIds}
      />
    </div>
  );
}

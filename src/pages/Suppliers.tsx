import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MapPin, Package, User as UserIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useSuppliers, useRegions } from "@/hooks/useSuppliers";
import { Skeleton } from "@/components/ui/skeleton";
import { saudiRegions } from "@/data/saudiRegions";

const Suppliers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  
  const { data: suppliers, isLoading } = useSuppliers(selectedRegion);
  const { data: availableRegions } = useRegions();

  const filteredSuppliers = suppliers?.filter(
    (supplier) =>
      supplier.business_name?.includes(searchQuery) ||
      supplier.full_name?.includes(searchQuery) ||
      supplier.region?.includes(searchQuery)
  ) || [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">الموردين</h1>
            <p className="text-muted-foreground">تعرف على شركاء النجاح من الموردين المعتمدين</p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="ابحث عن مورد..."
                className="pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Region Filter */}
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <MapPin className="h-4 w-4 ml-2 text-muted-foreground" />
                <SelectValue placeholder="جميع المناطق" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المناطق</SelectItem>
                {saudiRegions.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-card rounded-2xl border border-border p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Skeleton className="w-16 h-16 rounded-xl" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          )}

          {/* Suppliers Grid */}
          {!isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSuppliers.map((supplier, index) => (
                <div
                  key={supplier.id}
                  className="bg-card rounded-2xl border border-border p-6 hover:shadow-card transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                      {supplier.avatar_url ? (
                        <img 
                          src={supplier.avatar_url} 
                          alt={supplier.business_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserIcon className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{supplier.business_name}</h3>
                      <p className="text-sm text-muted-foreground">{supplier.full_name}</p>
                    </div>
                  </div>

                  {/* Supply Categories */}
                  {supplier.supply_categories && supplier.supply_categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {supplier.supply_categories.slice(0, 3).map((cat: string) => (
                        <Badge key={cat} variant="secondary" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                      {supplier.supply_categories.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{supplier.supply_categories.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    {supplier.region && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {supplier.region}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      {supplier.productsCount || 0} منتج
                    </div>
                  </div>

                  {/* Bio */}
                  {supplier.bio && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {supplier.bio}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link to={`/products?supplier=${supplier.user_id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        عرض المنتجات
                      </Button>
                    </Link>
                    <Link to={`/profile/${supplier.user_id}`}>
                      <Button variant="ghost" size="icon">
                        <UserIcon className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredSuppliers.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">لا توجد نتائج</h3>
              <p className="text-muted-foreground">جرب البحث بكلمات مختلفة أو غير المنطقة</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Suppliers;

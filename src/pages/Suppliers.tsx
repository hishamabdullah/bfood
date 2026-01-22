import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Star, Package } from "lucide-react";
import { Link } from "react-router-dom";

// بيانات تجريبية للموردين
const mockSuppliers = [
  {
    id: 1,
    name: "مزارع الخير",
    category: "خضروات وفواكه",
    location: "الرياض",
    rating: 4.8,
    productsCount: 45,
    image: "🌾",
    verified: true,
  },
  {
    id: 2,
    name: "مزارع الدواجن",
    category: "لحوم ودواجن",
    location: "جدة",
    rating: 4.6,
    productsCount: 28,
    image: "🐔",
    verified: true,
  },
  {
    id: 3,
    name: "معاصر الجبل",
    category: "زيوت",
    location: "الطائف",
    rating: 4.9,
    productsCount: 12,
    image: "🫒",
    verified: true,
  },
  {
    id: 4,
    name: "متجر الحبوب",
    category: "حبوب وبقوليات",
    location: "الدمام",
    rating: 4.5,
    productsCount: 35,
    image: "🌾",
    verified: false,
  },
  {
    id: 5,
    name: "مصنع الألبان",
    category: "ألبان وأجبان",
    location: "الرياض",
    rating: 4.7,
    productsCount: 22,
    image: "🥛",
    verified: true,
  },
  {
    id: 6,
    name: "بحار الخليج",
    category: "أسماك ومأكولات بحرية",
    location: "جدة",
    rating: 4.4,
    productsCount: 18,
    image: "🐟",
    verified: true,
  },
];

const Suppliers = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSuppliers = mockSuppliers.filter(
    (supplier) =>
      supplier.name.includes(searchQuery) ||
      supplier.category.includes(searchQuery) ||
      supplier.location.includes(searchQuery)
  );

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

          {/* Search */}
          <div className="relative max-w-md mb-8">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="ابحث عن مورد..."
              className="pr-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Suppliers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSuppliers.map((supplier, index) => (
              <div
                key={supplier.id}
                className="bg-card rounded-2xl border border-border p-6 hover:shadow-card transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center text-3xl">
                    {supplier.image}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{supplier.name}</h3>
                      {supplier.verified && (
                        <Badge variant="default" className="text-xs">موثق</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{supplier.category}</p>
                  </div>
                </div>

                {/* Info */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {supplier.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    {supplier.rating}
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    {supplier.productsCount} منتج
                  </div>
                </div>

                {/* Action */}
                <Link to={`/supplier/${supplier.id}`}>
                  <Button variant="outline" className="w-full">
                    عرض المنتجات
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredSuppliers.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">لا توجد نتائج</h3>
              <p className="text-muted-foreground">جرب البحث بكلمات مختلفة</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Suppliers;

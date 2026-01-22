import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, ShoppingCart, Plus } from "lucide-react";

// بيانات تجريبية للمنتجات
const mockProducts = [
  {
    id: 1,
    name: "طماطم طازجة",
    category: "خضروات",
    price: 12,
    unit: "كيلو",
    supplier: "مزارع الخير",
    image: "🍅",
    inStock: true,
  },
  {
    id: 2,
    name: "دجاج طازج",
    category: "لحوم",
    price: 28,
    unit: "كيلو",
    supplier: "مزارع الدواجن",
    image: "🍗",
    inStock: true,
  },
  {
    id: 3,
    name: "زيت زيتون بكر",
    category: "زيوت",
    price: 45,
    unit: "لتر",
    supplier: "معاصر الجبل",
    image: "🫒",
    inStock: true,
  },
  {
    id: 4,
    name: "أرز بسمتي",
    category: "حبوب",
    price: 18,
    unit: "كيلو",
    supplier: "متجر الحبوب",
    image: "🍚",
    inStock: true,
  },
  {
    id: 5,
    name: "جبنة موزاريلا",
    category: "ألبان",
    price: 35,
    unit: "كيلو",
    supplier: "مصنع الألبان",
    image: "🧀",
    inStock: false,
  },
  {
    id: 6,
    name: "بصل أحمر",
    category: "خضروات",
    price: 8,
    unit: "كيلو",
    supplier: "مزارع الخير",
    image: "🧅",
    inStock: true,
  },
];

const categories = ["الكل", "خضروات", "لحوم", "زيوت", "حبوب", "ألبان"];

const Products = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("الكل");

  const filteredProducts = mockProducts.filter((product) => {
    const matchesSearch = product.name.includes(searchQuery) || product.supplier.includes(searchQuery);
    const matchesCategory = selectedCategory === "الكل" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">المنتجات</h1>
            <p className="text-muted-foreground">تصفح المنتجات من جميع الموردين</p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="ابحث عن منتج أو مورد..."
                className="pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="whitespace-nowrap"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
              <div
                key={product.id}
                className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-card transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Product Image */}
                <div className="h-40 bg-muted flex items-center justify-center text-6xl">
                  {product.image}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.supplier}</p>
                    </div>
                    <Badge variant={product.inStock ? "default" : "secondary"}>
                      {product.inStock ? "متوفر" : "نفذ"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div>
                      <span className="text-xl font-bold text-primary">{product.price}</span>
                      <span className="text-sm text-muted-foreground mr-1">ر.س/{product.unit}</span>
                    </div>
                    <Button size="sm" disabled={!product.inStock}>
                      <Plus className="h-4 w-4" />
                      أضف للسلة
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredProducts.length === 0 && (
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

export default Products;

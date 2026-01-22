import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, X, Store } from "lucide-react";
import { useProducts, useCategories } from "@/hooks/useProducts";
import { useSupplierProfile } from "@/hooks/useSuppliers";
import ProductCard from "@/components/products/ProductCard";

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const supplierId = searchParams.get("supplier");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: products, isLoading: productsLoading } = useProducts(selectedCategory);
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: supplierProfile } = useSupplierProfile(supplierId || "");

  const filteredProducts = products?.filter((product) => {
    // فلتر حسب المورد إذا تم تحديده
    if (supplierId && product.supplier_id !== supplierId) {
      return false;
    }
    
    const matchesSearch = 
      product.name.includes(searchQuery) || 
      product.supplier_profile?.business_name?.includes(searchQuery);
    return matchesSearch;
  }) || [];

  const clearSupplierFilter = () => {
    searchParams.delete("supplier");
    setSearchParams(searchParams);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {supplierId && supplierProfile ? `منتجات ${supplierProfile.business_name}` : "المنتجات"}
            </h1>
            <p className="text-muted-foreground">
              {supplierId ? "تصفح منتجات هذا المورد" : "تصفح المنتجات من جميع الموردين"}
            </p>
            
            {/* Supplier Filter Badge */}
            {supplierId && supplierProfile && (
              <div className="mt-4 flex items-center gap-2">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
                  <Store className="h-4 w-4" />
                  <span className="font-medium">{supplierProfile.business_name}</span>
                  <button 
                    onClick={clearSupplierFilter}
                    className="hover:bg-primary/20 rounded-full p-1 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <Link to="/suppliers">
                  <Button variant="outline" size="sm">
                    عودة للموردين
                  </Button>
                </Link>
              </div>
            )}
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
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
                className="whitespace-nowrap"
              >
                الكل
              </Button>
              {categoriesLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-20" />
                ))
              ) : (
                categories?.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="whitespace-nowrap"
                  >
                    {category.icon && <span className="ml-1">{category.icon}</span>}
                    {category.name}
                  </Button>
                ))
              )}
            </div>
          </div>

          {/* Products Grid */}
          {productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden">
                  <Skeleton className="h-40 w-full" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-9 w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!productsLoading && filteredProducts.length === 0 && (
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

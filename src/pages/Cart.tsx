import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

// بيانات تجريبية للسلة
const initialCartItems = [
  {
    id: 1,
    name: "طماطم طازجة",
    price: 12,
    unit: "كيلو",
    quantity: 5,
    supplier: "مزارع الخير",
    image: "🍅",
  },
  {
    id: 2,
    name: "دجاج طازج",
    price: 28,
    unit: "كيلو",
    quantity: 3,
    supplier: "مزارع الدواجن",
    image: "🍗",
  },
  {
    id: 3,
    name: "زيت زيتون بكر",
    price: 45,
    unit: "لتر",
    quantity: 2,
    supplier: "معاصر الجبل",
    image: "🫒",
  },
];

const Cart = () => {
  const [cartItems, setCartItems] = useState(initialCartItems);

  const updateQuantity = (id: number, change: number) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item
      )
    );
  };

  const removeItem = (id: number) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = 15;
  const total = subtotal + deliveryFee;

  // تجميع المنتجات حسب المورد
  const groupedBySupplier = cartItems.reduce((acc, item) => {
    if (!acc[item.supplier]) {
      acc[item.supplier] = [];
    }
    acc[item.supplier].push(item);
    return acc;
  }, {} as Record<string, typeof cartItems>);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">السلة فارغة</h2>
            <p className="text-muted-foreground mb-6">لم تضف أي منتجات بعد</p>
            <Link to="/products">
              <Button variant="hero">
                تصفح المنتجات
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-8">سلة المشتريات</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {Object.entries(groupedBySupplier).map(([supplier, items]) => (
                <div key={supplier} className="bg-card rounded-2xl border border-border overflow-hidden">
                  {/* Supplier Header */}
                  <div className="bg-muted/50 px-6 py-3 border-b border-border">
                    <h3 className="font-semibold">{supplier}</h3>
                  </div>

                  {/* Items */}
                  <div className="divide-y divide-border">
                    {items.map((item) => (
                      <div key={item.id} className="p-4 flex gap-4">
                        {/* Image */}
                        <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center text-3xl shrink-0">
                          {item.image}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold mb-1">{item.name}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {item.price} ر.س / {item.unit}
                          </p>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, -1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-12 text-center font-medium">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Price & Remove */}
                        <div className="text-left">
                          <p className="font-bold text-lg text-primary">
                            {item.price * item.quantity} ر.س
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive mt-2"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-2xl border border-border p-6 sticky top-24">
                <h3 className="font-bold text-xl mb-6">ملخص الطلب</h3>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المجموع الفرعي</span>
                    <span>{subtotal} ر.س</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">رسوم التوصيل</span>
                    <span>{deliveryFee} ر.س</span>
                  </div>
                  <div className="border-t border-border pt-4 flex justify-between">
                    <span className="font-bold">الإجمالي</span>
                    <span className="font-bold text-xl text-primary">{total} ر.س</span>
                  </div>
                </div>

                <Button variant="hero" className="w-full" size="lg">
                  إتمام الطلب
                  <ArrowLeft className="h-5 w-5" />
                </Button>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  سيتم تقسيم الطلب تلقائياً حسب الموردين
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Cart;

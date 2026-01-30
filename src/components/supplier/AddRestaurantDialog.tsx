import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, User, Check } from "lucide-react";
import { useRestaurantsForSupplier } from "@/hooks/useCustomPrices";

interface Restaurant {
  user_id: string;
  business_name: string;
  full_name: string;
  customer_code: string | null;
}

interface AddRestaurantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingRestaurantIds: string[];
}

export default function AddRestaurantDialog({
  open,
  onOpenChange,
  existingRestaurantIds,
}: AddRestaurantDialogProps) {
  const navigate = useNavigate();
  const { data: restaurants, isLoading } = useRestaurantsForSupplier();
  const [search, setSearch] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // فلترة المطاعم التي ليس لها أسعار مخصصة بعد
  const availableRestaurants = useMemo(() => {
    if (!restaurants) return [];
    return restaurants.filter(r => !existingRestaurantIds.includes(r.user_id));
  }, [restaurants, existingRestaurantIds]);

  // فلترة حسب البحث (بالاسم أو رقم العميل)
  const filteredRestaurants = useMemo(() => {
    const query = search.trim().toLowerCase();
    
    // إظهار آخر 5 مطاعم مسجلة فقط عند عدم البحث
    if (!query) {
      return availableRestaurants.slice(0, 5);
    }
    
    return availableRestaurants.filter(r => {
      const businessName = (r.business_name || "").toLowerCase();
      const fullName = (r.full_name || "").toLowerCase();
      const customerCode = (r.customer_code || "").toLowerCase();
      
      // البحث برقم العميل (مطابقة جزئية أو كاملة)
      if (customerCode.includes(query) || query.includes(customerCode)) {
        return true;
      }
      
      // البحث باسم المطعم
      return businessName.includes(query) || fullName.includes(query);
    });
  }, [availableRestaurants, search]);

  const handleSelectRestaurant = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowConfirmation(true);
  };

  const handleConfirmAdd = () => {
    if (selectedRestaurant) {
      onOpenChange(false);
      setShowConfirmation(false);
      setSelectedRestaurant(null);
      setSearch("");
      navigate(`/supplier/custom-prices/${selectedRestaurant.user_id}`);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setSelectedRestaurant(null);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setSearch("");
      setSelectedRestaurant(null);
      setShowConfirmation(false);
    }
    onOpenChange(open);
  };

  // نافذة التأكيد
  if (showConfirmation && selectedRestaurant) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>تأكيد إضافة المطعم</DialogTitle>
            <DialogDescription>
              هل تريد إضافة أسعار مخصصة لهذا المطعم؟
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-lg">
                {selectedRestaurant.business_name || selectedRestaurant.full_name}
              </div>
              {selectedRestaurant.customer_code && (
                <span className="text-sm text-muted-foreground font-mono">
                  رقم العميل: {selectedRestaurant.customer_code}
                </span>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCancel}>
              إلغاء
            </Button>
            <Button onClick={handleConfirmAdd}>
              <Check className="h-4 w-4" />
              تأكيد الإضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>اختر مطعم لتخصيص أسعاره</DialogTitle>
          <DialogDescription>
            ابحث عن المطعم برقم العميل أو اسم المطعم
          </DialogDescription>
        </DialogHeader>

        {/* حقل البحث */}
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="رقم العميل أو اسم المطعم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9"
            autoFocus
          />
        </div>

        {/* قائمة المطاعم */}
        <div className="border rounded-lg max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="p-6 text-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
              جاري التحميل...
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              {availableRestaurants.length === 0 
                ? "جميع المطاعم لديها أسعار مخصصة بالفعل"
                : search.trim() 
                  ? `لا يوجد مطعم بـ "${search}"`
                  : "لا توجد مطاعم متاحة"
              }
            </div>
          ) : (
            <div className="divide-y">
              {filteredRestaurants.map((restaurant) => (
                <button
                  key={restaurant.user_id}
                  onClick={() => handleSelectRestaurant(restaurant)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-start"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {restaurant.business_name || restaurant.full_name}
                    </div>
                    {restaurant.customer_code && (
                      <span className="text-xs text-muted-foreground font-mono">
                        رقم العميل: {restaurant.customer_code}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

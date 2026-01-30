import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Search, User } from "lucide-react";
import { useRestaurantsForSupplier } from "@/hooks/useCustomPrices";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

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

  // فلترة المطاعم التي ليس لها أسعار مخصصة بعد
  const availableRestaurants = useMemo(() => {
    if (!restaurants) return [];
    return restaurants.filter(r => !existingRestaurantIds.includes(r.user_id));
  }, [restaurants, existingRestaurantIds]);

  // فلترة حسب البحث
  const filteredRestaurants = useMemo(() => {
    const query = search.trim().toLowerCase();
    
    if (!query) {
      return availableRestaurants.slice(0, 5);
    }
    
    return availableRestaurants.filter(r => {
      const businessName = (r.business_name || "").toLowerCase();
      const fullName = (r.full_name || "").toLowerCase();
      const customerCode = r.customer_code || "";
      
      return businessName.includes(query) ||
             fullName.includes(query) ||
             customerCode.includes(search.trim());
    });
  }, [availableRestaurants, search]);

  const handleSelectRestaurant = (restaurantId: string) => {
    onOpenChange(false);
    navigate(`/supplier/custom-prices/${restaurantId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>اختر مطعم لتخصيص أسعاره</DialogTitle>
        </DialogHeader>

        <Command shouldFilter={false} className="rounded-lg border">
          <CommandInput 
            placeholder="ابحث بالاسم أو رقم العميل..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-[300px]">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                جاري التحميل...
              </div>
            ) : filteredRestaurants.length === 0 ? (
              <CommandEmpty>
                {availableRestaurants.length === 0 
                  ? "جميع المطاعم لديها أسعار مخصصة بالفعل"
                  : "لا توجد نتائج"
                }
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredRestaurants.map((restaurant) => (
                  <CommandItem
                    key={restaurant.user_id}
                    value={restaurant.user_id}
                    onSelect={() => handleSelectRestaurant(restaurant.user_id)}
                    className="flex items-center gap-3 p-3 cursor-pointer"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {restaurant.customer_code && (
                          <span className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                            {restaurant.customer_code}
                          </span>
                        )}
                        <span className="font-medium truncate">
                          {restaurant.business_name || restaurant.full_name}
                        </span>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

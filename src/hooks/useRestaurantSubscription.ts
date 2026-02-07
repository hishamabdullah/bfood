import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SubscriptionStatus {
  isActive: boolean;
  isExpired: boolean;
  subscriptionType: string;
  subscriptionEndDate: string | null;
  daysRemaining: number | null;
  features: {
    can_order: boolean;
    can_use_templates: boolean;
    can_use_branches: boolean;
    can_use_favorites: boolean;
    can_view_analytics: boolean;
    can_use_custom_prices: boolean;
    can_repeat_orders: boolean;
  };
}

export const useRestaurantSubscription = () => {
  const { user, userRole, isSubUser, subUserInfo } = useAuth();

  // استخدم restaurant_id من المستخدم الفرعي أو user.id للمالك
  const restaurantId = isSubUser && subUserInfo ? subUserInfo.restaurant_id : user?.id;

  return useQuery({
    queryKey: ["restaurant-subscription", restaurantId],
    queryFn: async (): Promise<SubscriptionStatus> => {
      if (!restaurantId) {
        return getDefaultStatus();
      }

      const { data, error } = await supabase
        .from("restaurant_features")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching subscription:", error);
        return getDefaultStatus();
      }

      // إذا لم يكن هناك سجل، استخدم القيم الافتراضية
      if (!data) {
        return getDefaultStatus();
      }

      // التحقق من انتهاء الاشتراك
      let isExpired = false;
      let daysRemaining: number | null = null;

      if (data.subscription_end_date) {
        // تاريخ الانتهاء - الاشتراك ينتهي في بداية هذا اليوم
        const endDate = new Date(data.subscription_end_date);
        endDate.setHours(0, 0, 0, 0);
        
        // التاريخ الحالي بدون وقت
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        // الاشتراك منتهي إذا كان اليوم الحالي >= تاريخ الانتهاء
        isExpired = now >= endDate;
        
        if (!isExpired) {
          const diffTime = endDate.getTime() - now.getTime();
          daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } else {
          daysRemaining = 0;
        }
      }

      // الحساب غير نشط يعني انتهاء الاشتراك أيضاً
      const isActive = data.is_active && !isExpired;

      return {
        isActive,
        isExpired,
        subscriptionType: data.subscription_type || "basic",
        subscriptionEndDate: data.subscription_end_date,
        daysRemaining,
        features: {
          can_order: data.can_order ?? true,
          can_use_templates: data.can_use_templates ?? false,
          can_use_branches: data.can_use_branches ?? false,
          can_use_favorites: data.can_use_favorites ?? true,
          can_view_analytics: data.can_view_analytics ?? false,
          can_use_custom_prices: data.can_use_custom_prices ?? false,
          can_repeat_orders: data.can_repeat_orders ?? true,
        },
      };
    },
    enabled: !!restaurantId && userRole === "restaurant",
    staleTime: 5 * 60 * 1000, // 5 دقائق
    gcTime: 10 * 60 * 1000, // 10 دقائق
  });
};

const getDefaultStatus = (): SubscriptionStatus => ({
  isActive: true,
  isExpired: false,
  subscriptionType: "basic",
  subscriptionEndDate: null,
  daysRemaining: null,
  features: {
    can_order: true,
    can_use_templates: false,
    can_use_branches: false,
    can_use_favorites: true,
    can_view_analytics: false,
    can_use_custom_prices: false,
    can_repeat_orders: true,
  },
});

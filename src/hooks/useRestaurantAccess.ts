import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface RestaurantAccessFeatures {
  is_active: boolean;
  can_order: boolean;
  can_use_templates: boolean;
  can_use_branches: boolean;
  can_use_favorites: boolean;
  can_view_analytics: boolean;
  can_use_custom_prices: boolean;
  can_repeat_orders: boolean;
  can_manage_sub_users: boolean;
  max_orders_per_month: number | null;
  max_sub_users: number;
  subscription_type: string;
  subscription_end_date: string | null;
}

const defaultFeatures: RestaurantAccessFeatures = {
  is_active: true,
  can_order: true,
  can_use_templates: false,
  can_use_branches: false,
  can_use_favorites: true,
  can_view_analytics: false,
  can_use_custom_prices: false,
  can_repeat_orders: true,
  can_manage_sub_users: false,
  max_orders_per_month: null,
  max_sub_users: 3,
  subscription_type: "basic",
  subscription_end_date: null,
};

// Hook للتحقق من ميزات المطعم الحالي
export const useRestaurantAccess = () => {
  const { user, userRole } = useAuth();

  return useQuery({
    queryKey: ["restaurant-access", user?.id],
    queryFn: async () => {
      if (!user?.id) return defaultFeatures;

      const { data, error } = await supabase
        .from("restaurant_features")
        .select("*")
        .eq("restaurant_id", user.id)
        .single();

      if (error) {
        // إذا لم يوجد سجل، نرجع القيم الافتراضية
        if (error.code === "PGRST116") {
          return defaultFeatures;
        }
        throw error;
      }

      return {
        is_active: data.is_active,
        can_order: data.can_order,
        can_use_templates: data.can_use_templates,
        can_use_branches: data.can_use_branches,
        can_use_favorites: data.can_use_favorites,
        can_view_analytics: data.can_view_analytics,
        can_use_custom_prices: data.can_use_custom_prices,
        can_repeat_orders: data.can_repeat_orders,
        can_manage_sub_users: data.can_manage_sub_users ?? false,
        max_orders_per_month: data.max_orders_per_month,
        max_sub_users: data.max_sub_users ?? 3,
        subscription_type: data.subscription_type,
        subscription_end_date: data.subscription_end_date,
      } as RestaurantAccessFeatures;
    },
    enabled: !!user?.id && userRole === "restaurant",
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Helper function للتحقق من ميزة معينة
export const useHasFeature = (featureName: keyof RestaurantAccessFeatures) => {
  const { data: features, isLoading } = useRestaurantAccess();
  const { userRole } = useAuth();

  // المدير والمورد لديهم كل الميزات
  if (userRole === "admin" || userRole === "supplier") {
    return { hasFeature: true, isLoading: false };
  }

  if (isLoading || !features) {
    return { hasFeature: false, isLoading };
  }

  const value = features[featureName];
  const hasFeature = typeof value === "boolean" ? value : !!value;

  return { hasFeature, isLoading };
};

// التحقق من أن الحساب نشط
export const useIsRestaurantActive = () => {
  const { data: features, isLoading } = useRestaurantAccess();
  const { userRole } = useAuth();

  // المدير والمورد دائماً نشطين
  if (userRole === "admin" || userRole === "supplier") {
    return { isActive: true, isLoading: false };
  }

  return {
    isActive: features?.is_active ?? true,
    isLoading,
  };
};

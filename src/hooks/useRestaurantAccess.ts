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
  max_notes_chars: number | null;
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
  max_notes_chars: 500,
  subscription_type: "basic",
  subscription_end_date: null,
};

// Hook للتحقق من ميزات المطعم الحالي
export const useRestaurantAccess = () => {
  const { user, userRole, loading: authLoading, subUserInfo } = useAuth();
  
  // استخدم restaurantId الفعلي (سواء كان مستخدم أساسي أو فرعي)
  const restaurantId = subUserInfo.isSubUser ? subUserInfo.restaurantId : user?.id;
  const isRestaurantUser = userRole === "restaurant";

  return useQuery({
    queryKey: ["restaurant-access", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return defaultFeatures;

      const { data, error } = await supabase
        .from("restaurant_features")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching restaurant features:", error);
        return defaultFeatures;
      }
      
      // إذا لم يوجد سجل، نرجع القيم الافتراضية
      if (!data) {
        return defaultFeatures;
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
        max_notes_chars: (data as any).max_notes_chars ?? 500,
        subscription_type: data.subscription_type,
        subscription_end_date: data.subscription_end_date,
      } as RestaurantAccessFeatures;
    },
    enabled: !authLoading && !!restaurantId && isRestaurantUser,
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
  
  const isRestaurantUser = userRole === "restaurant";

  if (isLoading || !features || !isRestaurantUser) {
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
  
  const isRestaurantUser = userRole === "restaurant";
  
  if (!isRestaurantUser) {
    return { isActive: true, isLoading: false };
  }

  return {
    isActive: features?.is_active ?? true,
    isLoading,
  };
};

// Hook للحصول على الحد الأقصى لأحرف الملاحظات
export const useMaxNotesChars = () => {
  const { data: features, isLoading } = useRestaurantAccess();
  const { userRole } = useAuth();

  // المدير والمورد لديهم حد افتراضي كبير
  if (userRole === "admin" || userRole === "supplier") {
    return { maxChars: 1000, isLoading: false };
  }
  
  const isRestaurantUser = userRole === "restaurant";
  
  if (!isRestaurantUser || isLoading || !features) {
    return { maxChars: 500, isLoading };
  }

  return {
    maxChars: features.max_notes_chars ?? 500,
    isLoading,
  };
};

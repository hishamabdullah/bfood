import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SubUserContext {
  isSubUser: boolean;
  restaurantId: string | null;
  subUserId: string | null;
  permissions: {
    can_see_prices: boolean;
    can_see_favorite_suppliers_only: boolean;
    can_see_favorite_products_only: boolean;
    can_edit_order: boolean;
    can_cancel_order: boolean;
    can_approve_order: boolean;
    can_see_order_totals: boolean;
    can_view_analytics: boolean;
    can_manage_branches: boolean;
    can_manage_templates: boolean;
    can_view_subscription: boolean;
  } | null;
  allowedBranchIds: string[];
}

const defaultContext: SubUserContext = {
  isSubUser: false,
  restaurantId: null,
  subUserId: null,
  permissions: null,
  allowedBranchIds: [],
};

// Hook للتحقق مما إذا كان المستخدم الحالي مستخدماً فرعياً
export const useSubUserContext = () => {
  const { user, loading: authLoading } = useAuth();

  return useQuery({
    queryKey: ["sub-user-context", user?.id],
    queryFn: async (): Promise<SubUserContext> => {
      if (!user?.id) return defaultContext;

      // التحقق من وجود سجل في restaurant_sub_users
      const { data: subUserData, error } = await supabase
        .from("restaurant_sub_users")
        .select("id, restaurant_id, is_active")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (error || !subUserData) {
        return defaultContext;
      }

      // جلب الصلاحيات
      const { data: permData } = await supabase
        .from("restaurant_sub_user_permissions")
        .select("*")
        .eq("sub_user_id", subUserData.id)
        .maybeSingle();

      // جلب الفروع المسموح بها
      const { data: branchData } = await supabase
        .from("restaurant_sub_user_branches")
        .select("branch_id")
        .eq("sub_user_id", subUserData.id);

      const permissions = permData
        ? {
            can_see_prices: permData.can_see_prices ?? true,
            can_see_favorite_suppliers_only: permData.can_see_favorite_suppliers_only ?? false,
            can_see_favorite_products_only: permData.can_see_favorite_products_only ?? false,
            can_edit_order: permData.can_edit_order ?? true,
            can_cancel_order: permData.can_cancel_order ?? true,
            can_approve_order: permData.can_approve_order ?? false,
            can_see_order_totals: permData.can_see_order_totals ?? true,
            can_view_analytics: (permData as any).can_view_analytics ?? false,
            can_manage_branches: (permData as any).can_manage_branches ?? false,
            can_manage_templates: (permData as any).can_manage_templates ?? false,
            can_view_subscription: (permData as any).can_view_subscription ?? false,
          }
        : null;

      return {
        isSubUser: true,
        restaurantId: subUserData.restaurant_id,
        subUserId: subUserData.id,
        permissions,
        allowedBranchIds: (branchData || []).map((b) => b.branch_id),
      };
    },
    enabled: !authLoading && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook للحصول على معرف المطعم الفعلي (سواء كان مستخدم أساسي أو فرعي)
export const useEffectiveRestaurantId = () => {
  const { user } = useAuth();
  const { data: subUserContext, isLoading } = useSubUserContext();

  if (isLoading) {
    return { restaurantId: null, isLoading: true };
  }

  if (subUserContext?.isSubUser) {
    return { restaurantId: subUserContext.restaurantId, isLoading: false };
  }

  return { restaurantId: user?.id ?? null, isLoading: false };
};

// Hook للتحقق من صلاحية معينة للمستخدم الفرعي
export const useSubUserPermission = (
  permission: keyof NonNullable<SubUserContext["permissions"]>
) => {
  const { data: subUserContext, isLoading } = useSubUserContext();

  if (isLoading) {
    return { hasPermission: true, isLoading: true, isSubUser: false };
  }

  if (!subUserContext?.isSubUser) {
    // المستخدم الأساسي لديه كل الصلاحيات
    return { hasPermission: true, isLoading: false, isSubUser: false };
  }

  const hasPermission = subUserContext.permissions?.[permission] ?? false;
  return { hasPermission, isLoading: false, isSubUser: true };
};

// Hook للتحقق من رؤية الأسعار
export const useCanSeePrices = () => {
  return useSubUserPermission("can_see_prices");
};

// Hook للتحقق من إمكانية تعديل الطلب
export const useCanEditOrder = () => {
  return useSubUserPermission("can_edit_order");
};

// Hook للتحقق من إمكانية إلغاء الطلب
export const useCanCancelOrder = () => {
  return useSubUserPermission("can_cancel_order");
};

// Hook للتحقق من رؤية الإجماليات
export const useCanSeeOrderTotals = () => {
  return useSubUserPermission("can_see_order_totals");
};

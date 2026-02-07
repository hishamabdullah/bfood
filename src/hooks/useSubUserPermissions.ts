import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SubUserPermissions {
  can_see_prices: boolean;
  can_see_favorite_suppliers_only: boolean;
  can_see_favorite_products_only: boolean;
  can_edit_order: boolean;
  can_cancel_order: boolean;
  can_approve_order: boolean;
  can_see_order_totals: boolean;
}

const defaultPermissions: SubUserPermissions = {
  can_see_prices: true,
  can_see_favorite_suppliers_only: false,
  can_see_favorite_products_only: false,
  can_edit_order: false,
  can_cancel_order: false,
  can_approve_order: true,
  can_see_order_totals: true,
};

export const useSubUserPermissions = () => {
  const { user, isSubUser } = useAuth();

  return useQuery({
    queryKey: ["sub-user-permissions", user?.id],
    queryFn: async () => {
      if (!user?.id || !isSubUser) return defaultPermissions;

      const { data, error } = await supabase
        .rpc("get_sub_user_permissions", { _user_id: user.id });

      if (error) {
        console.error("Error fetching sub-user permissions:", error);
        return defaultPermissions;
      }

      if (data && data.length > 0) {
        return {
          can_see_prices: data[0].can_see_prices ?? true,
          can_see_favorite_suppliers_only: data[0].can_see_favorite_suppliers_only ?? false,
          can_see_favorite_products_only: data[0].can_see_favorite_products_only ?? false,
          can_edit_order: data[0].can_edit_order ?? false,
          can_cancel_order: data[0].can_cancel_order ?? false,
          can_approve_order: data[0].can_approve_order ?? true,
          can_see_order_totals: data[0].can_see_order_totals ?? true,
        } as SubUserPermissions;
      }

      return defaultPermissions;
    },
    enabled: !!user?.id && isSubUser,
    staleTime: 5 * 60 * 1000,
  });
};

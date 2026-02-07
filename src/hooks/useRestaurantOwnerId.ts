import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * يُرجع معرف مالك المطعم (Restaurant Owner) للمستخدم الحالي.
 * - للمالك: نفس user.id
 * - للمستخدم الفرعي: restaurant_id المرتبط به
 *
 * ملاحظة: نعتمد على دالة قاعدة البيانات get_restaurant_owner_id لضمان الاستقرار
 * حتى لو كانت subUserInfo لم تُحمّل بعد.
 */
export const useRestaurantOwnerId = () => {
  const { user, isSubUser, subUserInfo } = useAuth();

  return useQuery({
    queryKey: ["restaurant-owner-id", user?.id, isSubUser, subUserInfo?.restaurant_id],
    queryFn: async () => {
      if (!user?.id) return null;

      // غير مستخدم فرعي
      if (!isSubUser) return user.id;

      // إذا كانت معلومات المستخدم الفرعي جاهزة
      if (subUserInfo?.restaurant_id) return subUserInfo.restaurant_id;

      // fallback: اسأل الـ backend مباشرة
      const { data, error } = await supabase.rpc("get_restaurant_owner_id", {
        _user_id: user.id,
      });

      if (error) throw error;
      return (data as string) || user.id;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });
};

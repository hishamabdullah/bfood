import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface RestaurantFeatures {
  id: string;
  restaurant_id: string;
  is_active: boolean;
  can_order: boolean;
  can_use_templates: boolean;
  can_use_branches: boolean;
  can_use_favorites: boolean;
  can_view_analytics: boolean;
  can_use_custom_prices: boolean;
  can_repeat_orders: boolean;
  max_orders_per_month: number | null;
  subscription_type: string;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RestaurantWithFeatures {
  user_id: string;
  business_name: string;
  full_name: string;
  phone: string | null;
  customer_code: string | null;
  is_approved: boolean;
  created_at: string;
  features: RestaurantFeatures | null;
}

// جلب جميع المطاعم مع ميزاتها (للمدير)
export const useAllRestaurantsWithFeatures = () => {
  return useQuery({
    queryKey: ["admin-restaurants-features"],
    queryFn: async () => {
      // جلب جميع المطاعم
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "restaurant");

      if (rolesError) throw rolesError;

      const restaurantIds = roles?.map(r => r.user_id) || [];

      if (restaurantIds.length === 0) return [];

      // جلب الملفات الشخصية
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", restaurantIds);

      if (profilesError) throw profilesError;

      // جلب الميزات
      const { data: features, error: featuresError } = await supabase
        .from("restaurant_features")
        .select("*")
        .in("restaurant_id", restaurantIds);

      if (featuresError) throw featuresError;

      // دمج البيانات
      const result: RestaurantWithFeatures[] = profiles?.map(profile => ({
        user_id: profile.user_id,
        business_name: profile.business_name,
        full_name: profile.full_name,
        phone: profile.phone,
        customer_code: profile.customer_code,
        is_approved: profile.is_approved,
        created_at: profile.created_at,
        features: features?.find(f => f.restaurant_id === profile.user_id) as RestaurantFeatures || null,
      })) || [];

      return result;
    },
  });
};

// تحديث أو إنشاء ميزات مطعم
export const useUpdateRestaurantFeatures = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      restaurant_id,
      features,
    }: {
      restaurant_id: string;
      features: Partial<Omit<RestaurantFeatures, "id" | "restaurant_id" | "created_at" | "updated_at">>;
    }) => {
      // تحقق إذا كان هناك سجل موجود
      const { data: existing } = await supabase
        .from("restaurant_features")
        .select("id")
        .eq("restaurant_id", restaurant_id)
        .single();

      if (existing) {
        // تحديث السجل الموجود
        const { data, error } = await supabase
          .from("restaurant_features")
          .update(features)
          .eq("restaurant_id", restaurant_id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // إنشاء سجل جديد
        const { data, error } = await supabase
          .from("restaurant_features")
          .insert({
            restaurant_id,
            ...features,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-restaurants-features"] });
      toast({ title: "تم تحديث ميزات المطعم بنجاح" });
    },
    onError: (error) => {
      toast({
        title: "خطأ في تحديث الميزات",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// تفعيل/تعطيل حساب مطعم
export const useToggleRestaurantActive = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      restaurant_id,
      is_active,
    }: {
      restaurant_id: string;
      is_active: boolean;
    }) => {
      // تحقق إذا كان هناك سجل موجود
      const { data: existing } = await supabase
        .from("restaurant_features")
        .select("id")
        .eq("restaurant_id", restaurant_id)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("restaurant_features")
          .update({ is_active })
          .eq("restaurant_id", restaurant_id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("restaurant_features")
          .insert({
            restaurant_id,
            is_active,
          });

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-restaurants-features"] });
      toast({
        title: variables.is_active ? "تم تفعيل الحساب" : "تم تعطيل الحساب",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ في تحديث حالة الحساب",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

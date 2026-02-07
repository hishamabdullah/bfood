import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SubscriptionPlan {
  id: string;
  name: string;
  name_en: string | null;
  description: string | null;
  price: number;
  duration_months: number;
  can_order: boolean;
  can_use_templates: boolean;
  can_use_branches: boolean;
  can_use_favorites: boolean;
  can_view_analytics: boolean;
  can_use_custom_prices: boolean;
  can_repeat_orders: boolean;
  can_manage_sub_users: boolean;
  max_orders_per_month: number | null;
  max_sub_users: number | null;
  max_branches: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type SubscriptionPlanInput = Omit<SubscriptionPlan, "id" | "created_at" | "updated_at">;

// جلب جميع خطط الاشتراك
export const useSubscriptionPlans = (activeOnly = false) => {
  return useQuery({
    queryKey: ["subscription-plans", activeOnly],
    queryFn: async () => {
      let query = supabase
        .from("subscription_plans")
        .select("*")
        .order("price", { ascending: true });

      if (activeOnly) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as SubscriptionPlan[];
    },
  });
};

// جلب خطة اشتراك واحدة
export const useSubscriptionPlan = (planId: string | null) => {
  return useQuery({
    queryKey: ["subscription-plan", planId],
    queryFn: async () => {
      if (!planId) return null;

      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("id", planId)
        .single();

      if (error) throw error;
      return data as SubscriptionPlan;
    },
    enabled: !!planId,
  });
};

// إنشاء خطة اشتراك جديدة
export const useCreateSubscriptionPlan = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (plan: SubscriptionPlanInput) => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .insert(plan)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      toast({ title: "تم إنشاء خطة الاشتراك بنجاح" });
    },
    onError: (error) => {
      toast({
        title: "خطأ في إنشاء الخطة",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// تحديث خطة اشتراك
export const useUpdateSubscriptionPlan = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...plan }: Partial<SubscriptionPlan> & { id: string }) => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .update(plan)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      toast({ title: "تم تحديث خطة الاشتراك بنجاح" });
    },
    onError: (error) => {
      toast({
        title: "خطأ في تحديث الخطة",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// حذف خطة اشتراك
export const useDeleteSubscriptionPlan = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("subscription_plans")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      toast({ title: "تم حذف خطة الاشتراك بنجاح" });
    },
    onError: (error) => {
      toast({
        title: "خطأ في حذف الخطة",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// ربط خطة اشتراك بمطعم
export const useAssignPlanToRestaurant = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      restaurantId,
      planId,
      durationMonths,
    }: {
      restaurantId: string;
      planId: string;
      durationMonths: number;
    }) => {
      // جلب الخطة للحصول على الميزات
      const { data: plan, error: planError } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("id", planId)
        .single();

      if (planError) throw planError;

      // حساب تاريخ الانتهاء
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + durationMonths);

      // تحقق من وجود سجل ميزات
      const { data: existing } = await supabase
        .from("restaurant_features")
        .select("id")
        .eq("restaurant_id", restaurantId)
        .single();

      const featuresData = {
        plan_id: planId,
        is_active: true,
        can_order: plan.can_order,
        can_use_templates: plan.can_use_templates,
        can_use_branches: plan.can_use_branches,
        can_use_favorites: plan.can_use_favorites,
        can_view_analytics: plan.can_view_analytics,
        can_use_custom_prices: plan.can_use_custom_prices,
        can_repeat_orders: plan.can_repeat_orders,
        can_manage_sub_users: plan.can_manage_sub_users,
        max_orders_per_month: plan.max_orders_per_month,
        max_sub_users: plan.max_sub_users,
        max_branches: plan.max_branches,
        subscription_type: plan.name,
        subscription_start_date: startDate.toISOString(),
        subscription_end_date: endDate.toISOString(),
      };

      if (existing) {
        const { error } = await supabase
          .from("restaurant_features")
          .update(featuresData)
          .eq("restaurant_id", restaurantId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("restaurant_features")
          .insert({
            restaurant_id: restaurantId,
            ...featuresData,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-restaurants-features"] });
      queryClient.invalidateQueries({ queryKey: ["restaurant-subscription"] });
      toast({ title: "تم ربط الخطة بالمطعم بنجاح" });
    },
    onError: (error) => {
      toast({
        title: "خطأ في ربط الخطة",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

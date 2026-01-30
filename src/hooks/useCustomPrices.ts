import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { userDataQueryOptions, semiStaticQueryOptions } from "@/lib/queryConfig";

export interface CustomPrice {
  id: string;
  product_id: string;
  restaurant_id: string;
  supplier_id: string;
  custom_price: number;
  created_at: string;
  updated_at: string;
  restaurant_profile?: {
    business_name: string;
    full_name: string;
    customer_code?: string;
  } | null;
  product?: {
    name: string;
    price: number;
    unit: string;
  } | null;
}

// جلب الأسعار المخصصة للمورد
export const useSupplierCustomPrices = (productId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["supplier-custom-prices", user?.id, productId],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from("product_custom_prices")
        .select("id, product_id, restaurant_id, supplier_id, custom_price, created_at, updated_at")
        .eq("supplier_id", user.id)
        .order("created_at", { ascending: false });

      if (productId) {
        query = query.eq("product_id", productId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // جلب معلومات المطاعم والمنتجات بالتوازي
      const restaurantIds = [...new Set(data?.map(p => p.restaurant_id) || [])];
      const productIds = [...new Set(data?.map(p => p.product_id) || [])];

      const [profilesResult, productsResult] = await Promise.all([
        restaurantIds.length > 0
          ? supabase
              .from("profiles")
              .select("user_id, business_name, full_name, customer_code")
              .in("user_id", restaurantIds)
          : { data: [] },
        productIds.length > 0
          ? supabase
              .from("products")
              .select("id, name, price, unit")
              .in("id", productIds)
          : { data: [] },
      ]);

      const profileMap = new Map<string, typeof profilesResult.data extends (infer T)[] ? T : never>(
        profilesResult.data?.map(p => [p.user_id, p] as const) || []
      );
      const productMap = new Map<string, typeof productsResult.data extends (infer T)[] ? T : never>(
        productsResult.data?.map(p => [p.id, p] as const) || []
      );

      return data?.map(cp => ({
        ...cp,
        restaurant_profile: profileMap.get(cp.restaurant_id) || null,
        product: productMap.get(cp.product_id) || null,
      })) as CustomPrice[];
    },
    enabled: !!user,
    ...userDataQueryOptions,
  });
};

// جلب المطاعم المتاحة للمورد - باستخدام دالة آمنة
export const useRestaurantsForSupplier = () => {
  return useQuery({
    queryKey: ["restaurants-for-supplier"],
    queryFn: async () => {
      // استخدام الدالة الآمنة التي تتجاوز RLS
      const { data, error } = await supabase.rpc("get_approved_restaurants");

      if (error) throw error;

      return data || [];
    },
    ...semiStaticQueryOptions,
  });
};

// إضافة سعر مخصص
export const useCreateCustomPrice = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      product_id: string;
      restaurant_id: string;
      custom_price: number;
    }) => {
      if (!user) throw new Error("يجب تسجيل الدخول");

      const { data: result, error } = await supabase
        .from("product_custom_prices")
        .insert({
          ...data,
          supplier_id: user.id,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("يوجد سعر مخصص لهذا المطعم على هذا المنتج");
        }
        throw error;
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-custom-prices"] });
      toast.success("تم إضافة السعر المخصص بنجاح");
    },
    onError: (error: Error) => {
      console.error("Error creating custom price:", error);
      toast.error(error.message || "حدث خطأ أثناء إضافة السعر المخصص");
    },
  });
};

// تحديث سعر مخصص
export const useUpdateCustomPrice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, custom_price }: { id: string; custom_price: number }) => {
      const { data, error } = await supabase
        .from("product_custom_prices")
        .update({ custom_price })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-custom-prices"] });
      toast.success("تم تحديث السعر المخصص بنجاح");
    },
    onError: (error) => {
      console.error("Error updating custom price:", error);
      toast.error("حدث خطأ أثناء تحديث السعر المخصص");
    },
  });
};

// حذف سعر مخصص
export const useDeleteCustomPrice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("product_custom_prices")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-custom-prices"] });
      toast.success("تم حذف السعر المخصص بنجاح");
    },
    onError: (error) => {
      console.error("Error deleting custom price:", error);
      toast.error("حدث خطأ أثناء حذف السعر المخصص");
    },
  });
};

// جلب السعر المخصص للمطعم الحالي
export const useRestaurantCustomPrice = (productId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["restaurant-custom-price", productId, user?.id],
    queryFn: async () => {
      if (!user || !productId) return null;

      const { data, error } = await supabase
        .from("product_custom_prices")
        .select("custom_price")
        .eq("product_id", productId)
        .eq("restaurant_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data?.custom_price ?? null;
    },
    enabled: !!user && !!productId,
  });
};

// جلب جميع الأسعار المخصصة للمطعم الحالي
export const useRestaurantAllCustomPrices = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["restaurant-all-custom-prices", user?.id],
    queryFn: async () => {
      if (!user) return {};

      const { data, error } = await supabase
        .from("product_custom_prices")
        .select("product_id, custom_price")
        .eq("restaurant_id", user.id);

      if (error) throw error;

      // تحويل إلى map لسهولة الوصول
      const priceMap: Record<string, number> = {};
      data?.forEach(item => {
        priceMap[item.product_id] = item.custom_price;
      });

      return priceMap;
    },
    enabled: !!user,
  });
};

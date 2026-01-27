import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
        .select("*")
        .eq("supplier_id", user.id)
        .order("created_at", { ascending: false });

      if (productId) {
        query = query.eq("product_id", productId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // جلب معلومات المطاعم
      const restaurantIds = [...new Set(data?.map(p => p.restaurant_id) || [])];
      let profiles: any[] = [];
      if (restaurantIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, business_name, full_name")
          .in("user_id", restaurantIds);
        profiles = profilesData || [];
      }

      // جلب معلومات المنتجات
      const productIds = [...new Set(data?.map(p => p.product_id) || [])];
      let products: any[] = [];
      if (productIds.length > 0) {
        const { data: productsData } = await supabase
          .from("products")
          .select("id, name, price, unit")
          .in("id", productIds);
        products = productsData || [];
      }

      return data?.map(cp => ({
        ...cp,
        restaurant_profile: profiles.find(p => p.user_id === cp.restaurant_id) || null,
        product: products.find(p => p.id === cp.product_id) || null,
      })) as CustomPrice[];
    },
    enabled: !!user,
  });
};

// جلب المطاعم المتاحة للمورد
export const useRestaurantsForSupplier = () => {
  return useQuery({
    queryKey: ["restaurants-for-supplier"],
    queryFn: async () => {
      // جلب جميع المطاعم المعتمدين
      const { data: restaurantRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "restaurant");

      if (rolesError) throw rolesError;

      const restaurantIds = restaurantRoles?.map(r => r.user_id) || [];
      if (restaurantIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, business_name, full_name, is_approved, customer_code")
        .in("user_id", restaurantIds)
        .eq("is_approved", true);

      if (profilesError) throw profilesError;

      return profiles || [];
    },
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

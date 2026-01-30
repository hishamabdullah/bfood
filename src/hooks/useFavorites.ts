import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { userDataQueryOptions } from "@/lib/queryConfig";

export const useFavoriteProducts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["favorite-products", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("favorite_products")
        .select("product_id")
        .eq("user_id", user.id);

      if (error) throw error;
      return data.map((f) => f.product_id);
    },
    enabled: !!user,
    ...userDataQueryOptions,
  });
};

export const useFavoriteSuppliers = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["favorite-suppliers", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("favorite_suppliers")
        .select("supplier_id")
        .eq("user_id", user.id);

      if (error) throw error;
      return data.map((f) => f.supplier_id);
    },
    enabled: !!user,
    ...userDataQueryOptions,
  });
};

export const useToggleFavoriteProduct = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      isFavorite,
    }: {
      productId: string;
      isFavorite: boolean;
    }) => {
      if (!user) throw new Error("يجب تسجيل الدخول");

      if (isFavorite) {
        const { error } = await supabase
          .from("favorite_products")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favorite_products")
          .insert({ user_id: user.id, product_id: productId });
        if (error) throw error;
      }
    },
    onSuccess: (_, { isFavorite }) => {
      queryClient.invalidateQueries({ queryKey: ["favorite-products"] });
      toast.success(isFavorite ? "تمت الإزالة من المفضلة" : "تمت الإضافة للمفضلة");
    },
    onError: () => {
      toast.error("حدث خطأ");
    },
  });
};

export const useToggleFavoriteSupplier = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      supplierId,
      isFavorite,
    }: {
      supplierId: string;
      isFavorite: boolean;
    }) => {
      if (!user) throw new Error("يجب تسجيل الدخول");

      if (isFavorite) {
        const { error } = await supabase
          .from("favorite_suppliers")
          .delete()
          .eq("user_id", user.id)
          .eq("supplier_id", supplierId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favorite_suppliers")
          .insert({ user_id: user.id, supplier_id: supplierId });
        if (error) throw error;
      }
    },
    onSuccess: (_, { isFavorite }) => {
      queryClient.invalidateQueries({ queryKey: ["favorite-suppliers"] });
      toast.success(isFavorite ? "تمت الإزالة من المفضلة" : "تمت الإضافة للمفضلة");
    },
    onError: () => {
      toast.error("حدث خطأ");
    },
  });
};

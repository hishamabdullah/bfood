import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type PriceTier = {
  id?: string;
  min_quantity: number;
  price_per_unit: number;
};

export type SupplierProduct = Tables<"products"> & {
  category?: Tables<"categories"> | null;
  price_tiers?: PriceTier[];
};

export const useSupplierProducts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["supplier-products", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(*),
          price_tiers:product_price_tiers(id, min_quantity, price_per_unit)
        `)
        .eq("supplier_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SupplierProduct[];
    },
    enabled: !!user,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (product: Omit<TablesInsert<"products">, "supplier_id"> & { price_tiers?: PriceTier[] }) => {
      if (!user) throw new Error("يجب تسجيل الدخول");

      const { price_tiers, ...productData } = product;

      const { data, error } = await supabase
        .from("products")
        .insert({
          ...productData,
          supplier_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Insert price tiers if provided
      if (price_tiers && price_tiers.length > 0) {
        const tiersToInsert = price_tiers.map((tier) => ({
          product_id: data.id,
          min_quantity: tier.min_quantity,
          price_per_unit: tier.price_per_unit,
        }));

        const { error: tiersError } = await supabase
          .from("product_price_tiers")
          .insert(tiersToInsert);

        if (tiersError) {
          console.error("Error inserting price tiers:", tiersError);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("تمت إضافة المنتج بنجاح");
    },
    onError: (error) => {
      console.error("Error creating product:", error);
      toast.error("حدث خطأ أثناء إضافة المنتج");
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, price_tiers, ...product }: TablesUpdate<"products"> & { id: string; price_tiers?: PriceTier[] }) => {
      const { data, error } = await supabase
        .from("products")
        .update(product)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Handle price tiers update
      if (price_tiers !== undefined) {
        // Delete existing tiers
        await supabase
          .from("product_price_tiers")
          .delete()
          .eq("product_id", id);

        // Insert new tiers
        if (price_tiers.length > 0) {
          const tiersToInsert = price_tiers.map((tier) => ({
            product_id: id,
            min_quantity: tier.min_quantity,
            price_per_unit: tier.price_per_unit,
          }));

          const { error: tiersError } = await supabase
            .from("product_price_tiers")
            .insert(tiersToInsert);

          if (tiersError) {
            console.error("Error updating price tiers:", tiersError);
          }
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("تم تحديث المنتج بنجاح");
    },
    onError: (error) => {
      console.error("Error updating product:", error);
      toast.error("حدث خطأ أثناء تحديث المنتج");
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      // Delete price tiers first
      await supabase
        .from("product_price_tiers")
        .delete()
        .eq("product_id", productId);

      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("تم حذف المنتج بنجاح");
    },
    onError: (error) => {
      console.error("Error deleting product:", error);
      toast.error("حدث خطأ أثناء حذف المنتج");
    },
  });
};

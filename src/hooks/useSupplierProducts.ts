import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { dynamicQueryOptions } from "@/lib/queryConfig";

export type PriceTier = {
  id?: string;
  min_quantity: number;
  price_per_unit: number;
};

export type SupplierProduct = Tables<"products"> & {
  category?: Tables<"categories"> | null;
  price_tiers?: PriceTier[];
  product_categories?: { category_id: string; categories: Tables<"categories"> | null }[];
  product_subcategories?: { subcategory_id: string }[];
  product_sections?: { section_id: string }[];
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
          category:categories(id, name, name_en, icon),
          price_tiers:product_price_tiers(id, min_quantity, price_per_unit),
          product_categories(category_id, categories:categories(id, name, name_en, icon)),
          product_subcategories(subcategory_id),
          product_sections(section_id)
        `)
        .eq("supplier_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SupplierProduct[];
    },
    enabled: !!user,
    ...dynamicQueryOptions,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (product: Omit<TablesInsert<"products">, "supplier_id"> & { price_tiers?: PriceTier[]; category_ids?: string[]; subcategory_ids?: string[]; section_ids?: string[] }) => {
      if (!user) throw new Error("يجب تسجيل الدخول");

      const { price_tiers, category_ids, subcategory_ids, section_ids, ...productData } = product;

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

      // Insert multi-category assignments
      if (category_ids && category_ids.length > 0) {
        await supabase.from("product_categories").insert(
          category_ids.map((cid) => ({ product_id: data.id, category_id: cid }))
        );
      }
      if (subcategory_ids && subcategory_ids.length > 0) {
        await supabase.from("product_subcategories").insert(
          subcategory_ids.map((sid) => ({ product_id: data.id, subcategory_id: sid }))
        );
      }
      if (section_ids && section_ids.length > 0) {
        await supabase.from("product_sections").insert(
          section_ids.map((sid) => ({ product_id: data.id, section_id: sid }))
        );
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
    mutationFn: async ({ id, price_tiers, category_ids, subcategory_ids, section_ids, ...product }: TablesUpdate<"products"> & { id: string; price_tiers?: PriceTier[]; category_ids?: string[]; subcategory_ids?: string[]; section_ids?: string[] }) => {
      const { data, error } = await supabase
        .from("products")
        .update(product)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Handle price tiers update
      if (price_tiers !== undefined) {
        await supabase.from("product_price_tiers").delete().eq("product_id", id);
        if (price_tiers.length > 0) {
          const tiersToInsert = price_tiers.map((tier) => ({
            product_id: id,
            min_quantity: tier.min_quantity,
            price_per_unit: tier.price_per_unit,
          }));
          const { error: tiersError } = await supabase.from("product_price_tiers").insert(tiersToInsert);
          if (tiersError) console.error("Error updating price tiers:", tiersError);
        }
      }

      // Handle multi-category updates
      if (category_ids !== undefined) {
        await supabase.from("product_categories").delete().eq("product_id", id);
        if (category_ids.length > 0) {
          await supabase.from("product_categories").insert(
            category_ids.map((cid) => ({ product_id: id, category_id: cid }))
          );
        }
      }
      if (subcategory_ids !== undefined) {
        await supabase.from("product_subcategories").delete().eq("product_id", id);
        if (subcategory_ids.length > 0) {
          await supabase.from("product_subcategories").insert(
            subcategory_ids.map((sid) => ({ product_id: id, subcategory_id: sid }))
          );
        }
      }
      if (section_ids !== undefined) {
        await supabase.from("product_sections").delete().eq("product_id", id);
        if (section_ids.length > 0) {
          await supabase.from("product_sections").insert(
            section_ids.map((sid) => ({ product_id: id, section_id: sid }))
          );
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

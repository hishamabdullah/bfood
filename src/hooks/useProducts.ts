import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Product = Tables<"products"> & {
  category?: Tables<"categories"> | null;
  supplier_profile?: Tables<"profiles"> | null;
  country_of_origin?: string | null;
  stock_quantity?: number | null;
  delivery_fee?: number | null;
};

export const useProducts = (categoryId?: string) => {
  return useQuery({
    queryKey: ["products", categoryId],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(`
          *,
          category:categories(*)
        `)
        .eq("in_stock", true);

      if (categoryId && categoryId !== "all") {
        query = query.eq("category_id", categoryId);
      }

      const { data: products, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch supplier profiles separately
      const supplierIds = [...new Set(products?.map(p => p.supplier_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", supplierIds);

      // Map profiles to products
      const productsWithProfiles = products?.map(product => ({
        ...product,
        supplier_profile: profiles?.find(p => p.user_id === product.supplier_id) || null,
      })) || [];

      return productsWithProfiles as Product[];
    },
  });
};

export const useProduct = (productId: string) => {
  return useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const { data: product, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(*)
        `)
        .eq("id", productId)
        .maybeSingle();

      if (error) throw error;
      if (!product) return null;

      // Fetch supplier profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", product.supplier_id)
        .maybeSingle();

      return {
        ...product,
        supplier_profile: profile,
      } as Product;
    },
    enabled: !!productId,
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
  });
};

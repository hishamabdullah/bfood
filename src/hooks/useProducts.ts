import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { dynamicQueryOptions, semiStaticQueryOptions } from "@/lib/queryConfig";

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
          category:categories(id, name, name_en, icon)
        `)
        .eq("in_stock", true);

      if (categoryId && categoryId !== "all") {
        query = query.eq("category_id", categoryId);
      }

      const { data: products, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch supplier profiles separately - only needed fields
      const supplierIds = [...new Set(products?.map(p => p.supplier_id) || [])];
      
      if (supplierIds.length === 0) return products as Product[];
      
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, business_name, avatar_url, region")
        .in("user_id", supplierIds);

      // Map profiles to products
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const productsWithProfiles = products?.map(product => ({
        ...product,
        supplier_profile: profileMap.get(product.supplier_id) || null,
      })) || [];

      return productsWithProfiles as Product[];
    },
    ...dynamicQueryOptions,
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
          category:categories(id, name, name_en, icon)
        `)
        .eq("id", productId)
        .maybeSingle();

      if (error) throw error;
      if (!product) return null;

      // Fetch supplier profile - only needed fields
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, business_name, avatar_url, region, phone, google_maps_url, minimum_order_amount, default_delivery_fee")
        .eq("user_id", product.supplier_id)
        .maybeSingle();

      return {
        ...product,
        supplier_profile: profile,
      } as Product;
    },
    enabled: !!productId,
    ...dynamicQueryOptions,
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, name_en, icon")
        .order("name");

      if (error) throw error;
      return data;
    },
    ...semiStaticQueryOptions,
  });
};

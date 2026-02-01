import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
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

const PRODUCTS_PER_PAGE = 12;

export const useProducts = (categoryId?: string, subcategoryId?: string) => {
  return useInfiniteQuery({
    queryKey: ["products", categoryId, subcategoryId],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * PRODUCTS_PER_PAGE;
      const to = from + PRODUCTS_PER_PAGE - 1;

      let query = supabase
        .from("products")
        .select(`
          *,
          category:categories(id, name, name_en, icon)
        `, { count: "exact" })
        .eq("in_stock", true)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (categoryId && categoryId !== "all") {
        query = query.eq("category_id", categoryId);
      }

      if (subcategoryId && subcategoryId !== "all") {
        query = query.eq("subcategory_id", subcategoryId);
      }

      const { data: products, error, count } = await query;

      if (error) throw error;

      // Fetch supplier profiles separately - only needed fields
      const supplierIds = [...new Set(products?.map(p => p.supplier_id) || [])];
      
      if (supplierIds.length === 0) {
        return {
          products: products as Product[],
          nextPage: null,
          totalCount: count || 0,
        };
      }
      
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, business_name, avatar_url, region, city, service_regions, service_cities")
        .in("user_id", supplierIds);

      // Map profiles to products
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const productsWithProfiles = products?.map(product => ({
        ...product,
        supplier_profile: profileMap.get(product.supplier_id) || null,
      })) || [];

      const hasMore = (from + PRODUCTS_PER_PAGE) < (count || 0);

      return {
        products: productsWithProfiles as Product[],
        nextPage: hasMore ? pageParam + 1 : null,
        totalCount: count || 0,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: dynamicQueryOptions.staleTime,
    gcTime: dynamicQueryOptions.gcTime,
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

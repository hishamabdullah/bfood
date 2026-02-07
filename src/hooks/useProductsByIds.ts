import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/hooks/useProducts";
import { dynamicQueryOptions } from "@/lib/queryConfig";

/**
 * يجلب منتجات محددة بالـ IDs (مفيد لوضع: منتجات المفضلة فقط).
 * لا يعتمد على pagination حتى لا تظهر صفحة فارغة.
 */
export const useProductsByIds = (productIds: string[]) => {
  const stableIds = [...new Set(productIds)].filter(Boolean).sort();

  return useQuery({
    queryKey: ["products-by-ids", stableIds.join(",")],
    queryFn: async () => {
      if (stableIds.length === 0) return [] as Product[];

      const { data: products, error } = await supabase
        .from("products")
        .select(
          `
          *,
          category:categories(id, name, name_en, icon)
        `
        )
        .in("id", stableIds)
        .eq("in_stock", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const supplierIds = [...new Set(products?.map((p) => p.supplier_id) || [])];
      if (supplierIds.length === 0) return (products || []) as Product[];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select(
          "user_id, business_name, avatar_url, region, city, service_regions, service_cities, minimum_order_amount, default_delivery_fee, delivery_option, google_maps_url"
        )
        .in("user_id", supplierIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
      const productsWithProfiles = (products || []).map((product) => ({
        ...product,
        supplier_profile: profileMap.get(product.supplier_id) || null,
      }));

      return productsWithProfiles as Product[];
    },
    enabled: stableIds.length > 0,
    ...dynamicQueryOptions,
  });
};

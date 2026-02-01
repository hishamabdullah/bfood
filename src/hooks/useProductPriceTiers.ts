import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { semiStaticQueryOptions } from "@/lib/queryConfig";

// Hook to fetch all product IDs that have price tiers
export const useProductsWithPriceTiers = () => {
  return useQuery({
    queryKey: ["products-with-price-tiers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_price_tiers")
        .select("product_id");

      if (error) throw error;
      
      // Return unique product IDs that have price tiers
      const productIds = [...new Set(data?.map(tier => tier.product_id) || [])];
      return productIds;
    },
    ...semiStaticQueryOptions,
  });
};

// Hook to fetch price tiers for a specific product
export const useProductPriceTiers = (productId: string) => {
  return useQuery({
    queryKey: ["product-price-tiers", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_price_tiers")
        .select("*")
        .eq("product_id", productId)
        .order("min_quantity", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!productId,
    ...semiStaticQueryOptions,
  });
};

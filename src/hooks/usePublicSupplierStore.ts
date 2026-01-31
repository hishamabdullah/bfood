import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { dynamicQueryOptions } from "@/lib/queryConfig";

export type PublicProduct = Tables<"products"> & {
  category?: Tables<"categories"> | null;
};

export type SupplierInfo = {
  user_id: string;
  business_name: string;
  avatar_url: string | null;
  bio: string | null;
  region: string | null;
  city: string | null;
  phone: string | null;
  minimum_order_amount: number | null;
};

export const usePublicSupplierStore = (supplierId: string) => {
  return useQuery({
    queryKey: ["public-supplier-store", supplierId],
    queryFn: async () => {
      // Fetch supplier profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, business_name, avatar_url, bio, region, city, phone, minimum_order_amount")
        .eq("user_id", supplierId)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) return null;

      // Fetch supplier's products
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(id, name, name_en, icon)
        `)
        .eq("supplier_id", supplierId)
        .eq("in_stock", true)
        .order("created_at", { ascending: false });

      if (productsError) throw productsError;

      return {
        supplier: profile as SupplierInfo,
        products: products as PublicProduct[],
      };
    },
    enabled: !!supplierId,
    ...dynamicQueryOptions,
  });
};

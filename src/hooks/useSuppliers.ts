import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { dynamicQueryOptions, semiStaticQueryOptions, userDataQueryOptions } from "@/lib/queryConfig";

export type Supplier = Tables<"profiles"> & {
  productsCount?: number;
};

export const useSuppliers = (region?: string) => {
  return useQuery({
    queryKey: ["suppliers", region],
    queryFn: async () => {
      // جلب جميع الموردين (من user_roles)
      const { data: supplierRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "supplier");

      if (rolesError) throw rolesError;

      const supplierIds = supplierRoles?.map(r => r.user_id) || [];
      
      if (supplierIds.length === 0) return [];

      // Run profiles and product counts in parallel
      let query = supabase
        .from("profiles")
        .select("user_id, business_name, full_name, avatar_url, region, supply_categories")
        .in("user_id", supplierIds);

      if (region && region !== "all") {
        query = query.eq("region", region);
      }

      const [profilesResult, productCountsResult] = await Promise.all([
        query,
        supabase
          .from("products")
          .select("supplier_id")
          .in("supplier_id", supplierIds)
      ]);

      if (profilesResult.error) throw profilesResult.error;

      // حساب عدد المنتجات لكل مورد
      const countMap = new Map<string, number>();
      productCountsResult.data?.forEach(p => {
        countMap.set(p.supplier_id, (countMap.get(p.supplier_id) || 0) + 1);
      });

      // دمج البيانات
      const suppliersWithCounts = profilesResult.data?.map(profile => ({
        ...profile,
        productsCount: countMap.get(profile.user_id) || 0,
      })) || [];

      return suppliersWithCounts as Supplier[];
    },
    ...dynamicQueryOptions,
  });
};

export const useSupplierProfile = (userId: string) => {
  return useQuery({
    queryKey: ["supplier-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    ...userDataQueryOptions,
  });
};

// جلب المناطق المتاحة
export const useRegions = () => {
  return useQuery({
    queryKey: ["regions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("region")
        .not("region", "is", null);

      if (error) throw error;

      // استخراج المناطق الفريدة
      const uniqueRegions = [...new Set(data?.map(p => p.region).filter(Boolean))];
      return uniqueRegions as string[];
    },
    ...semiStaticQueryOptions,
  });
};

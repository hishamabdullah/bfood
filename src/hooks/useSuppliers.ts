import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { dynamicQueryOptions, semiStaticQueryOptions, userDataQueryOptions } from "@/lib/queryConfig";

export type Supplier = Tables<"profiles"> & {
  productsCount?: number;
  service_regions?: string[] | null;
  service_cities?: string[] | null;
};

export const useSuppliers = (region?: string, city?: string) => {
  return useQuery({
    queryKey: ["suppliers", region, city],
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
      const query = supabase
        .from("profiles")
        .select("user_id, business_name, full_name, avatar_url, region, city, supply_categories, service_regions, service_cities")
        .in("user_id", supplierIds);

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

      // دمج البيانات مع الفلترة حسب مناطق الخدمة
      let suppliersWithCounts = profilesResult.data?.map(profile => ({
        ...profile,
        productsCount: countMap.get(profile.user_id) || 0,
      })) || [];

      // فلترة حسب المنطقة - تحقق من service_regions أو region
      if (region && region !== "all") {
        suppliersWithCounts = suppliersWithCounts.filter(supplier => {
          const serviceRegions = (supplier as any).service_regions as string[] | null;
          // إذا لديه مناطق خدمة محددة، تحقق منها
          if (serviceRegions && serviceRegions.length > 0) {
            return serviceRegions.includes(region);
          }
          // وإلا تحقق من المنطقة الأصلية (المقر)
          return supplier.region === region;
        });
      }

      // فلترة حسب المدينة - تحقق من service_cities أو city
      if (city && city !== "all") {
        suppliersWithCounts = suppliersWithCounts.filter(supplier => {
          const serviceCities = (supplier as any).service_cities as string[] | null;
          // إذا لديه مدن خدمة محددة، تحقق منها
          if (serviceCities && serviceCities.length > 0) {
            return serviceCities.includes(city);
          }
          // وإلا تحقق من المدينة الأصلية
          return supplier.city === city;
        });
      }

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

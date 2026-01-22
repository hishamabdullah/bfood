import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

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

      // جلب ملفات الموردين
      let query = supabase
        .from("profiles")
        .select("*")
        .in("user_id", supplierIds);

      // فلتر حسب المنطقة إذا تم تحديدها
      if (region && region !== "all") {
        query = query.eq("region", region);
      }

      const { data: profiles, error: profilesError } = await query;

      if (profilesError) throw profilesError;

      // جلب عدد المنتجات لكل مورد
      const { data: productCounts } = await supabase
        .from("products")
        .select("supplier_id")
        .in("supplier_id", supplierIds);

      // حساب عدد المنتجات لكل مورد
      const countMap = new Map<string, number>();
      productCounts?.forEach(p => {
        countMap.set(p.supplier_id, (countMap.get(p.supplier_id) || 0) + 1);
      });

      // دمج البيانات
      const suppliersWithCounts = profiles?.map(profile => ({
        ...profile,
        productsCount: countMap.get(profile.user_id) || 0,
      })) || [];

      return suppliersWithCounts as Supplier[];
    },
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
  });
};

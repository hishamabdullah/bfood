import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SupplierCategory {
  id: string;
  name: string;
  name_en: string | null;
  icon: string | null;
}

export const useSupplierCategories = () => {
  return useQuery({
    queryKey: ["supplier-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplier_categories")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as SupplierCategory[];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const getSupplierCategoryName = (
  category: SupplierCategory,
  language: string
): string => {
  return language === "en" && category.name_en ? category.name_en : category.name;
};

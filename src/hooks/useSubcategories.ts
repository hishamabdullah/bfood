import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  name_en: string | null;
  icon: string | null;
  created_at: string;
}

// جلب جميع الأقسام الفرعية
export const useSubcategories = () => {
  return useQuery({
    queryKey: ["subcategories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subcategories")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Subcategory[];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// جلب الأقسام الفرعية حسب التصنيف
export const useSubcategoriesByCategory = (categoryId: string | null) => {
  return useQuery({
    queryKey: ["subcategories", categoryId],
    queryFn: async () => {
      if (!categoryId) return [];
      
      const { data, error } = await supabase
        .from("subcategories")
        .select("*")
        .eq("category_id", categoryId)
        .order("name");

      if (error) throw error;
      return data as Subcategory[];
    },
    enabled: !!categoryId,
    staleTime: 1000 * 60 * 10,
  });
};

// إنشاء قسم فرعي
export const useCreateSubcategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (subcategory: { category_id: string; name: string; name_en?: string; icon?: string }) => {
      const { data, error } = await supabase
        .from("subcategories")
        .insert(subcategory)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
      toast({ title: "تم إضافة القسم الفرعي بنجاح" });
    },
    onError: (error) => {
      toast({ title: "خطأ في إضافة القسم الفرعي", description: error.message, variant: "destructive" });
    },
  });
};

// تحديث قسم فرعي
export const useUpdateSubcategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...subcategory }: { id: string; name?: string; name_en?: string | null; icon?: string | null }) => {
      const { data, error } = await supabase
        .from("subcategories")
        .update(subcategory)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
      toast({ title: "تم تحديث القسم الفرعي بنجاح" });
    },
    onError: (error) => {
      toast({ title: "خطأ في تحديث القسم الفرعي", description: error.message, variant: "destructive" });
    },
  });
};

// حذف قسم فرعي
export const useDeleteSubcategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (subcategoryId: string) => {
      const { error } = await supabase
        .from("subcategories")
        .delete()
        .eq("id", subcategoryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
      toast({ title: "تم حذف القسم الفرعي بنجاح" });
    },
    onError: (error) => {
      toast({ title: "خطأ في حذف القسم الفرعي", description: error.message, variant: "destructive" });
    },
  });
};

// دالة للحصول على اسم القسم الفرعي حسب اللغة
export const getSubcategoryName = (
  subcategory: Subcategory,
  language: string
): string => {
  return language === "en" && subcategory.name_en ? subcategory.name_en : subcategory.name;
};

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Section {
  id: string;
  subcategory_id: string;
  name: string;
  name_en: string | null;
  icon: string | null;
  created_at: string;
}

// جلب جميع الأقسام الداخلية
export const useSections = () => {
  return useQuery({
    queryKey: ["sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sections")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Section[];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// جلب الأقسام الداخلية حسب القسم الفرعي
export const useSectionsBySubcategory = (subcategoryId: string | null) => {
  return useQuery({
    queryKey: ["sections", subcategoryId],
    queryFn: async () => {
      if (!subcategoryId) return [];
      
      const { data, error } = await supabase
        .from("sections")
        .select("*")
        .eq("subcategory_id", subcategoryId)
        .order("name");

      if (error) throw error;
      return data as Section[];
    },
    enabled: !!subcategoryId,
    staleTime: 1000 * 60 * 10,
  });
};

// إنشاء قسم داخلي
export const useCreateSection = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (section: { subcategory_id: string; name: string; name_en?: string; icon?: string }) => {
      const { data, error } = await supabase
        .from("sections")
        .insert(section)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sections"] });
      toast({ title: "تم إضافة القسم الداخلي بنجاح" });
    },
    onError: (error) => {
      toast({ title: "خطأ في إضافة القسم الداخلي", description: error.message, variant: "destructive" });
    },
  });
};

// تحديث قسم داخلي
export const useUpdateSection = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...section }: { id: string; name?: string; name_en?: string | null; icon?: string | null }) => {
      const { data, error } = await supabase
        .from("sections")
        .update(section)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sections"] });
      toast({ title: "تم تحديث القسم الداخلي بنجاح" });
    },
    onError: (error) => {
      toast({ title: "خطأ في تحديث القسم الداخلي", description: error.message, variant: "destructive" });
    },
  });
};

// حذف قسم داخلي
export const useDeleteSection = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (sectionId: string) => {
      const { error } = await supabase
        .from("sections")
        .delete()
        .eq("id", sectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sections"] });
      toast({ title: "تم حذف القسم الداخلي بنجاح" });
    },
    onError: (error) => {
      toast({ title: "خطأ في حذف القسم الداخلي", description: error.message, variant: "destructive" });
    },
  });
};

// دالة للحصول على اسم القسم الداخلي حسب اللغة
export const getSectionName = (
  section: Section,
  language: string
): string => {
  return language === "en" && section.name_en ? section.name_en : section.name;
};

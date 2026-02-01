import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { dynamicQueryOptions } from "@/lib/queryConfig";
import type { CartItem } from "@/contexts/CartContext";

export interface OrderTemplateItem {
  id: string;
  template_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  product?: {
    id: string;
    name: string;
    name_en?: string;
    price: number;
    unit: string;
    image_url?: string;
    supplier_id: string;
    in_stock: boolean;
    supplier_profile?: {
      user_id: string;
      business_name: string;
    };
  };
}

export interface OrderTemplate {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  items?: OrderTemplateItem[];
}

// Fetch all templates for current restaurant
export const useOrderTemplates = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["order-templates", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("order_templates")
        .select(`
          *,
          items:order_template_items(
            id,
            template_id,
            product_id,
            quantity,
            created_at,
            product:products(
              id,
              name,
              name_en,
              price,
              unit,
              image_url,
              supplier_id,
              in_stock
            )
          )
        `)
        .eq("restaurant_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch supplier profiles for products
      const supplierIds = new Set<string>();
      data?.forEach((template: any) => {
        template.items?.forEach((item: any) => {
          if (item.product?.supplier_id) {
            supplierIds.add(item.product.supplier_id);
          }
        });
      });

      let supplierProfiles: { user_id: string; business_name: string }[] = [];
      if (supplierIds.size > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, business_name")
          .in("user_id", Array.from(supplierIds));
        supplierProfiles = profiles || [];
      }

      const profileMap = new Map(supplierProfiles.map(p => [p.user_id, p]));

      // Map supplier profiles to products
      const templatesWithProfiles = data?.map((template: any) => ({
        ...template,
        items: template.items?.map((item: any) => ({
          ...item,
          product: item.product ? {
            ...item.product,
            supplier_profile: profileMap.get(item.product.supplier_id) || null,
          } : null,
        })),
      }));

      return templatesWithProfiles as OrderTemplate[];
    },
    enabled: !!user,
    ...dynamicQueryOptions,
  });
};

// Create a new template from cart items
export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ name, description, items }: { name: string; description?: string; items: CartItem[] }) => {
      if (!user) throw new Error("يجب تسجيل الدخول");
      if (items.length === 0) throw new Error("السلة فارغة");

      // Create template
      const { data: template, error: templateError } = await supabase
        .from("order_templates")
        .insert({
          restaurant_id: user.id,
          name,
          description,
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Create template items
      const templateItems = items.map(item => ({
        template_id: template.id,
        product_id: item.product.id,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_template_items")
        .insert(templateItems);

      if (itemsError) throw itemsError;

      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-templates"] });
      toast.success("تم حفظ القالب بنجاح");
    },
    onError: (error) => {
      console.error("Error creating template:", error);
      toast.error("حدث خطأ أثناء حفظ القالب");
    },
  });
};

// Delete a template
export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from("order_templates")
        .delete()
        .eq("id", templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-templates"] });
      toast.success("تم حذف القالب");
    },
    onError: (error) => {
      console.error("Error deleting template:", error);
      toast.error("حدث خطأ أثناء حذف القالب");
    },
  });
};

// Update template name/description
export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, description }: { id: string; name: string; description?: string }) => {
      const { data, error } = await supabase
        .from("order_templates")
        .update({ name, description })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-templates"] });
      toast.success("تم تحديث القالب");
    },
    onError: (error) => {
      console.error("Error updating template:", error);
      toast.error("حدث خطأ أثناء تحديث القالب");
    },
  });
};

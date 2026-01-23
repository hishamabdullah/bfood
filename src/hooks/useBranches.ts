import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

export type Branch = Tables<"branches">;

export interface CreateBranchParams {
  name: string;
  google_maps_url?: string;
  address?: string;
  is_default?: boolean;
}

export const useBranches = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["branches", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .eq("restaurant_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Branch[];
    },
    enabled: !!user,
  });
};

export const useCreateBranch = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: CreateBranchParams) => {
      if (!user) throw new Error("يجب تسجيل الدخول أولاً");

      // إذا كان هذا الفرع الافتراضي، نلغي الافتراضي من الفروع الأخرى
      if (params.is_default) {
        await supabase
          .from("branches")
          .update({ is_default: false })
          .eq("restaurant_id", user.id);
      }

      const { data, error } = await supabase
        .from("branches")
        .insert({
          restaurant_id: user.id,
          name: params.name,
          google_maps_url: params.google_maps_url || null,
          address: params.address || null,
          is_default: params.is_default || false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
  });
};

export const useUpdateBranch = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...params }: CreateBranchParams & { id: string }) => {
      if (!user) throw new Error("يجب تسجيل الدخول أولاً");

      // إذا كان هذا الفرع الافتراضي، نلغي الافتراضي من الفروع الأخرى
      if (params.is_default) {
        await supabase
          .from("branches")
          .update({ is_default: false })
          .eq("restaurant_id", user.id)
          .neq("id", id);
      }

      const { data, error } = await supabase
        .from("branches")
        .update({
          name: params.name,
          google_maps_url: params.google_maps_url || null,
          address: params.address || null,
          is_default: params.is_default || false,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
  });
};

export const useDeleteBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("branches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
  });
};

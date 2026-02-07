import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";
import { userDataQueryOptions } from "@/lib/queryConfig";

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
        .select("id, name, address, google_maps_url, is_default, restaurant_id, created_at")
        .eq("restaurant_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Branch[];
    },
    enabled: !!user,
    ...userDataQueryOptions,
  });
};

// Hook to get max branches limit from restaurant features
export const useMaxBranchesLimit = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["max-branches-limit", user?.id],
    queryFn: async () => {
      if (!user) return { maxBranches: 1, currentCount: 0 };
      
      // Get restaurant features to check max_branches
      const { data: features } = await supabase
        .from("restaurant_features")
        .select("max_branches")
        .eq("restaurant_id", user.id)
        .single();

      // Get current branch count
      const { count } = await supabase
        .from("branches")
        .select("*", { count: "exact", head: true })
        .eq("restaurant_id", user.id);

      return {
        maxBranches: features?.max_branches ?? 1,
        currentCount: count ?? 0,
      };
    },
    enabled: !!user,
    ...userDataQueryOptions,
  });
};

export const useCreateBranch = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: CreateBranchParams) => {
      if (!user) throw new Error("يجب تسجيل الدخول أولاً");

      // Check branch limit before creating
      const { data: features } = await supabase
        .from("restaurant_features")
        .select("max_branches")
        .eq("restaurant_id", user.id)
        .single();

      const { count } = await supabase
        .from("branches")
        .select("*", { count: "exact", head: true })
        .eq("restaurant_id", user.id);

      const maxBranches = features?.max_branches ?? 1;
      const currentCount = count ?? 0;

      if (currentCount >= maxBranches) {
        throw new Error(`خطتك تسمح بحد أقصى ${maxBranches} فروع فقط`);
      }

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
      queryClient.invalidateQueries({ queryKey: ["max-branches-limit"] });
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
      queryClient.invalidateQueries({ queryKey: ["max-branches-limit"] });
    },
  });
};

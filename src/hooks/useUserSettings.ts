import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface UserSettings {
  id: string;
  user_id: string;
  sound_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const useUserSettings = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-settings", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      // إذا لم تكن هناك إعدادات، أنشئ إعدادات افتراضية
      if (!data) {
        const { data: newSettings, error: insertError } = await supabase
          .from("user_settings")
          .insert({ user_id: user.id, sound_enabled: true })
          .select()
          .single();

        if (insertError) {
          console.error("Error creating user settings:", insertError);
          // إرجاع إعدادات افتراضية في حالة الفشل
          return { sound_enabled: true } as UserSettings;
        }

        return newSettings as UserSettings;
      }

      return data as UserSettings;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

export const useUpdateUserSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<Pick<UserSettings, "sound_enabled">>) => {
      if (!user?.id) throw new Error("User not authenticated");

      // تحقق إذا كانت الإعدادات موجودة
      const { data: existing } = await supabase
        .from("user_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        // تحديث الإعدادات الموجودة
        const { data, error } = await supabase
          .from("user_settings")
          .update(settings)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // إنشاء إعدادات جديدة
        const { data, error } = await supabase
          .from("user_settings")
          .insert({ user_id: user.id, ...settings })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-settings", user?.id] });
    },
    onError: (error) => {
      console.error("Error updating user settings:", error);
      toast.error("حدث خطأ أثناء تحديث الإعدادات");
    },
  });
};

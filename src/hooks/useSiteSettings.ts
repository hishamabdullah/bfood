import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SiteSetting {
  id: string;
  key: string;
  value: string | null;
}

export const useSiteSettings = () => {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*");

      if (error) throw error;
      
      // Convert to a key-value object for easier access
      const settings: Record<string, string | null> = {};
      data?.forEach((setting: SiteSetting) => {
        settings[setting.key] = setting.value;
      });
      
      return settings;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

export const useUpdateSiteSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string | null }) => {
      const { data, error } = await supabase
        .from("site_settings")
        .update({ value })
        .eq("key", key)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("تم تحديث الإعداد بنجاح");
    },
    onError: (error) => {
      console.error("Error updating setting:", error);
      toast.error("حدث خطأ أثناء تحديث الإعداد");
    },
  });
};

export const useUploadLogo = () => {
  const queryClient = useQueryClient();
  const updateSetting = useUpdateSiteSetting();

  return useMutation({
    mutationFn: async ({ 
      file, 
      type 
    }: { 
      file: File; 
      type: "header_logo" | "header_logo_dark" | "favicon" 
    }) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${type}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("logos")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Update setting
      const settingKeyMap: Record<string, string> = {
        header_logo: "header_logo_url",
        header_logo_dark: "header_logo_dark_url",
        favicon: "favicon_url",
      };
      await updateSetting.mutateAsync({ key: settingKeyMap[type], value: publicUrl });

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
    onError: (error) => {
      console.error("Error uploading logo:", error);
      toast.error("حدث خطأ أثناء رفع الشعار");
    },
  });
};

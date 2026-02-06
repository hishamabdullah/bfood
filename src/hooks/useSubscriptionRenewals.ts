import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SubscriptionRenewal {
  id: string;
  restaurant_id: string;
  amount: number;
  subscription_type: string;
  receipt_url: string | null;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  restaurant?: {
    business_name: string;
    full_name: string;
    customer_code: string | null;
    phone: string | null;
  };
}

export interface SubscriptionSettings {
  subscription_price: string;
  subscription_bank_name: string;
  subscription_bank_account_name: string;
  subscription_bank_iban: string;
}

// جلب إعدادات الاشتراك
export const useSubscriptionSettings = () => {
  return useQuery({
    queryKey: ["subscription-settings"],
    queryFn: async (): Promise<SubscriptionSettings> => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", [
          "subscription_price",
          "subscription_bank_name",
          "subscription_bank_account_name",
          "subscription_bank_iban",
        ]);

      if (error) throw error;

      const settings: SubscriptionSettings = {
        subscription_price: "500",
        subscription_bank_name: "",
        subscription_bank_account_name: "",
        subscription_bank_iban: "",
      };

      data?.forEach((item) => {
        if (item.key in settings) {
          (settings as any)[item.key] = item.value || "";
        }
      });

      return settings;
    },
  });
};

// تحديث إعدادات الاشتراك (للمدير)
export const useUpdateSubscriptionSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<SubscriptionSettings>) => {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value: value?.toString() || "",
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("site_settings")
          .update({ value: update.value })
          .eq("key", update.key);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-settings"] });
      toast.success("تم تحديث إعدادات الاشتراك");
    },
    onError: (error) => {
      console.error("Error updating settings:", error);
      toast.error("حدث خطأ أثناء تحديث الإعدادات");
    },
  });
};

// جلب طلب التجديد الحالي للمطعم
export const useMyRenewalRequest = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-renewal-request", user?.id],
    queryFn: async (): Promise<SubscriptionRenewal | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("subscription_renewals")
        .select("*")
        .eq("restaurant_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as SubscriptionRenewal | null;
    },
    enabled: !!user?.id,
  });
};

// إنشاء طلب تجديد
export const useCreateRenewalRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      amount,
      subscriptionType,
      receiptUrl,
    }: {
      amount: number;
      subscriptionType: string;
      receiptUrl: string;
    }) => {
      if (!user?.id) throw new Error("غير مسجل");

      const { data, error } = await supabase
        .from("subscription_renewals")
        .insert({
          restaurant_id: user.id,
          amount,
          subscription_type: subscriptionType,
          receipt_url: receiptUrl,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-renewal-request"] });
      toast.success("تم إرسال طلب التجديد بنجاح");
    },
    onError: (error) => {
      console.error("Error creating renewal request:", error);
      toast.error("حدث خطأ أثناء إرسال الطلب");
    },
  });
};

// جلب جميع طلبات التجديد (للمدير)
export const useAllRenewalRequests = () => {
  return useQuery({
    queryKey: ["all-renewal-requests"],
    queryFn: async (): Promise<SubscriptionRenewal[]> => {
      // جلب الطلبات
      const { data: renewals, error } = await supabase
        .from("subscription_renewals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // جلب بيانات المطاعم
      const restaurantIds = [...new Set(renewals?.map((r) => r.restaurant_id) || [])];
      
      if (restaurantIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, business_name, full_name, customer_code, phone")
        .in("user_id", restaurantIds);

      const profilesMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      return (renewals || []).map((renewal) => ({
        ...renewal,
        restaurant: profilesMap.get(renewal.restaurant_id) || undefined,
      })) as SubscriptionRenewal[];
    },
  });
};

// تحديث حالة طلب التجديد (للمدير)
export const useUpdateRenewalStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      renewalId,
      status,
      adminNotes,
      restaurantId,
      subscriptionMonths,
    }: {
      renewalId: string;
      status: "approved" | "rejected";
      adminNotes?: string;
      restaurantId: string;
      subscriptionMonths?: number;
    }) => {
      // تحديث حالة الطلب
      const { error: updateError } = await supabase
        .from("subscription_renewals")
        .update({ status, admin_notes: adminNotes || null })
        .eq("id", renewalId);

      if (updateError) throw updateError;

      // إذا تمت الموافقة، تحديث تاريخ انتهاء الاشتراك
      if (status === "approved" && subscriptionMonths) {
        const newEndDate = new Date();
        newEndDate.setMonth(newEndDate.getMonth() + subscriptionMonths);

        // التحقق من وجود سجل في restaurant_features
        const { data: existingFeatures } = await supabase
          .from("restaurant_features")
          .select("id")
          .eq("restaurant_id", restaurantId)
          .maybeSingle();

        if (existingFeatures) {
          // تحديث السجل الموجود
          const { error: featuresError } = await supabase
            .from("restaurant_features")
            .update({
              subscription_end_date: newEndDate.toISOString(),
              is_active: true,
            })
            .eq("restaurant_id", restaurantId);

          if (featuresError) throw featuresError;
        } else {
          // إنشاء سجل جديد
          const { error: insertError } = await supabase
            .from("restaurant_features")
            .insert({
              restaurant_id: restaurantId,
              subscription_end_date: newEndDate.toISOString(),
              is_active: true,
            });

          if (insertError) throw insertError;
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["all-renewal-requests"] });
      toast.success(
        variables.status === "approved"
          ? "تمت الموافقة على طلب التجديد"
          : "تم رفض طلب التجديد"
      );
    },
    onError: (error) => {
      console.error("Error updating renewal status:", error);
      toast.error("حدث خطأ أثناء تحديث الحالة");
    },
  });
};

// رفع إيصال الدفع
export const uploadRenewalReceipt = async (
  file: File,
  restaurantId: string
): Promise<string> => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${restaurantId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("subscription-receipts")
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from("subscription-receipts")
    .getPublicUrl(fileName);

  return data.publicUrl;
};

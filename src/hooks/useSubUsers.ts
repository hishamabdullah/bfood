import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const getAccessTokenWithRetry = async (): Promise<string> => {
  // أحياناً بعد Refresh تكون الجلسة لم تجهز بعد، فنحاول أكثر من مرة قبل الفشل.
  for (let attempt = 0; attempt < 4; attempt++) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) return token;
    await sleep(250);
  }
  throw new Error("تعذر التحقق من جلسة الدخول. فضلاً أعد تسجيل الدخول ثم حاول مرة أخرى.");
};

export interface SubUserPermissions {
  can_see_prices: boolean;
  can_see_favorite_suppliers_only: boolean;
  can_see_favorite_products_only: boolean;
  can_edit_order: boolean;
  can_cancel_order: boolean;
  can_approve_order: boolean;
  can_see_order_totals: boolean;
  can_view_analytics: boolean;
  can_manage_branches: boolean;
  can_manage_templates: boolean;
  can_view_subscription: boolean;
}

export interface SubUser {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  permissions: SubUserPermissions | null;
  branch_ids: string[];
}

// جلب المستخدمين الفرعيين للمطعم
export const useSubUsers = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["sub-users", user?.id],
    queryFn: async (): Promise<SubUser[]> => {
      if (!user?.id) return [];

      // جلب المستخدمين الفرعيين
      const { data: subUsers, error } = await supabase
        .from("restaurant_sub_users")
        .select("*")
        .eq("restaurant_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!subUsers || subUsers.length === 0) return [];

      // جلب الصلاحيات والفروع لكل مستخدم
      const subUserIds = subUsers.map((su) => su.id);

      const [permissionsResult, branchesResult] = await Promise.all([
        supabase
          .from("restaurant_sub_user_permissions")
          .select("*")
          .in("sub_user_id", subUserIds),
        supabase
          .from("restaurant_sub_user_branches")
          .select("*")
          .in("sub_user_id", subUserIds),
      ]);

      const permissionsMap = new Map(
        (permissionsResult.data || []).map((p) => [p.sub_user_id, p])
      );

      const branchesMap = new Map<string, string[]>();
      (branchesResult.data || []).forEach((b) => {
        const existing = branchesMap.get(b.sub_user_id) || [];
        existing.push(b.branch_id);
        branchesMap.set(b.sub_user_id, existing);
      });

      return subUsers.map((su) => ({
        id: su.id,
        user_id: su.user_id,
        full_name: su.full_name,
        phone: su.phone,
        email: (su as any).email || null,
        is_active: su.is_active ?? true,
        created_at: su.created_at ?? "",
        permissions: permissionsMap.get(su.id)
          ? {
              can_see_prices: permissionsMap.get(su.id)!.can_see_prices ?? true,
              can_see_favorite_suppliers_only:
                permissionsMap.get(su.id)!.can_see_favorite_suppliers_only ?? false,
              can_see_favorite_products_only:
                permissionsMap.get(su.id)!.can_see_favorite_products_only ?? false,
              can_edit_order: permissionsMap.get(su.id)!.can_edit_order ?? true,
              can_cancel_order: permissionsMap.get(su.id)!.can_cancel_order ?? true,
              can_approve_order: permissionsMap.get(su.id)!.can_approve_order ?? false,
              can_see_order_totals: permissionsMap.get(su.id)!.can_see_order_totals ?? true,
              can_view_analytics: (permissionsMap.get(su.id) as any)?.can_view_analytics ?? false,
              can_manage_branches: (permissionsMap.get(su.id) as any)?.can_manage_branches ?? false,
              can_manage_templates: (permissionsMap.get(su.id) as any)?.can_manage_templates ?? false,
              can_view_subscription: (permissionsMap.get(su.id) as any)?.can_view_subscription ?? false,
            }
          : null,
        branch_ids: branchesMap.get(su.id) || [],
      }));
    },
    enabled: !!user?.id,
  });
};

// إنشاء مستخدم فرعي
export const useCreateSubUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      full_name: string;
      phone?: string;
      branch_ids: string[];
      permissions: SubUserPermissions;
    }) => {
      const accessToken = await getAccessTokenWithRetry();

      const { data: result, error } = await supabase.functions.invoke("create-sub-user", {
        body: {
          ...data,
          email: data.email.trim().toLowerCase(),
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (error) {
        // supabase-js قد يُرجع FunctionsHttpError مع body داخل context
        const anyErr = error as any;
        const rawBody = anyErr?.context?.body;

        let message = error.message;
        if (rawBody) {
          try {
            const parsed = typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody;
            message = parsed?.error ?? parsed?.message ?? message;
          } catch {
            // ignore JSON parse errors
          }
        }

        throw new Error(message);
      }

      if ((result as any)?.error) throw new Error((result as any).error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-users"] });
      toast({ title: "تم إنشاء المستخدم الفرعي بنجاح" });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل في إنشاء المستخدم الفرعي",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// تحديث مستخدم فرعي
export const useUpdateSubUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      sub_user_id: string;
      full_name?: string;
      phone?: string;
      is_active?: boolean;
      branch_ids?: string[];
      permissions?: Partial<SubUserPermissions>;
    }) => {
      const accessToken = await getAccessTokenWithRetry();

      const { data: result, error } = await supabase.functions.invoke("update-sub-user", {
        body: data,
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-users"] });
      toast({ title: "تم تحديث المستخدم الفرعي بنجاح" });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل في تحديث المستخدم الفرعي",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// حذف مستخدم فرعي
export const useDeleteSubUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (sub_user_id: string) => {
      const accessToken = await getAccessTokenWithRetry();

      const { data: result, error } = await supabase.functions.invoke("delete-sub-user", {
        body: { sub_user_id },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-users"] });
      toast({ title: "تم حذف المستخدم الفرعي بنجاح" });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل في حذف المستخدم الفرعي",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

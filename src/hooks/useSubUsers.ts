import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface SubUserPermissions {
  can_see_prices: boolean;
  can_see_favorite_suppliers_only: boolean;
  can_see_favorite_products_only: boolean;
  can_edit_order: boolean;
  can_cancel_order: boolean;
  can_approve_order: boolean;
  can_see_order_totals: boolean;
}

export interface SubUser {
  id: string;
  restaurant_id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  email?: string;
  permissions?: SubUserPermissions;
  branches?: { branch_id: string; branch_name?: string }[];
}

export interface CreateSubUserParams {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  permissions: SubUserPermissions;
  branch_ids: string[];
}

export interface UpdateSubUserParams {
  sub_user_id: string;
  full_name?: string;
  phone?: string;
  is_active?: boolean;
  permissions?: Partial<SubUserPermissions>;
  branch_ids?: string[];
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

      // جلب الصلاحيات لكل مستخدم
      const subUserIds = subUsers.map((su) => su.id);
      const { data: permissions } = await supabase
        .from("restaurant_sub_user_permissions")
        .select("*")
        .in("sub_user_id", subUserIds);

      // جلب الفروع لكل مستخدم
      const { data: userBranches } = await supabase
        .from("restaurant_sub_user_branches")
        .select("sub_user_id, branch_id")
        .in("sub_user_id", subUserIds);

      // جلب أسماء الفروع
      const { data: branches } = await supabase
        .from("branches")
        .select("id, name")
        .eq("restaurant_id", user.id);

      const branchMap = new Map(branches?.map((b) => [b.id, b.name]) || []);

      return subUsers.map((su) => ({
        ...su,
        permissions: permissions?.find((p) => p.sub_user_id === su.id) || {
          can_see_prices: true,
          can_see_favorite_suppliers_only: false,
          can_see_favorite_products_only: false,
          can_edit_order: false,
          can_cancel_order: false,
          can_approve_order: true,
          can_see_order_totals: true,
        },
        branches: userBranches
          ?.filter((ub) => ub.sub_user_id === su.id)
          .map((ub) => ({
            branch_id: ub.branch_id,
            branch_name: branchMap.get(ub.branch_id),
          })),
      }));
    },
    enabled: !!user?.id,
  });
};

// إنشاء مستخدم فرعي جديد
export const useCreateSubUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: CreateSubUserParams) => {
      if (!user?.id) throw new Error("يجب تسجيل الدخول");

      // إنشاء حساب المستخدم في Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: params.email,
        password: params.password,
        options: {
          data: {
            full_name: params.full_name,
            is_sub_user: true,
            parent_restaurant_id: user.id,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("فشل في إنشاء المستخدم");

      const newUserId = authData.user.id;

      // إنشاء سجل المستخدم الفرعي
      const { data: subUser, error: subUserError } = await supabase
        .from("restaurant_sub_users")
        .insert({
          restaurant_id: user.id,
          user_id: newUserId,
          full_name: params.full_name,
          phone: params.phone || null,
          is_active: true,
        })
        .select()
        .single();

      if (subUserError) throw subUserError;

      // إنشاء صلاحيات المستخدم
      const { error: permError } = await supabase
        .from("restaurant_sub_user_permissions")
        .insert({
          sub_user_id: subUser.id,
          ...params.permissions,
        });

      if (permError) throw permError;

      // ربط المستخدم بالفروع
      if (params.branch_ids.length > 0) {
        const branchInserts = params.branch_ids.map((branch_id) => ({
          sub_user_id: subUser.id,
          branch_id,
        }));

        const { error: branchError } = await supabase
          .from("restaurant_sub_user_branches")
          .insert(branchInserts);

        if (branchError) throw branchError;
      }

      return subUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-users"] });
      toast({ title: "تم إنشاء المستخدم بنجاح" });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إنشاء المستخدم",
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
    mutationFn: async (params: UpdateSubUserParams) => {
      // تحديث بيانات المستخدم الأساسية
      if (params.full_name || params.phone !== undefined || params.is_active !== undefined) {
        const updateData: any = {};
        if (params.full_name) updateData.full_name = params.full_name;
        if (params.phone !== undefined) updateData.phone = params.phone;
        if (params.is_active !== undefined) updateData.is_active = params.is_active;

        const { error } = await supabase
          .from("restaurant_sub_users")
          .update(updateData)
          .eq("id", params.sub_user_id);

        if (error) throw error;
      }

      // تحديث الصلاحيات
      if (params.permissions) {
        const { error } = await supabase
          .from("restaurant_sub_user_permissions")
          .update(params.permissions)
          .eq("sub_user_id", params.sub_user_id);

        if (error) throw error;
      }

      // تحديث الفروع
      if (params.branch_ids) {
        // حذف الفروع القديمة
        await supabase
          .from("restaurant_sub_user_branches")
          .delete()
          .eq("sub_user_id", params.sub_user_id);

        // إضافة الفروع الجديدة
        if (params.branch_ids.length > 0) {
          const branchInserts = params.branch_ids.map((branch_id) => ({
            sub_user_id: params.sub_user_id,
            branch_id,
          }));

          const { error } = await supabase
            .from("restaurant_sub_user_branches")
            .insert(branchInserts);

          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-users"] });
      toast({ title: "تم تحديث المستخدم بنجاح" });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تحديث المستخدم",
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
    mutationFn: async (subUserId: string) => {
      const { error } = await supabase
        .from("restaurant_sub_users")
        .delete()
        .eq("id", subUserId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-users"] });
      toast({ title: "تم حذف المستخدم بنجاح" });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حذف المستخدم",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// جلب عدد المستخدمين الفرعيين المسموح به
export const useSubUsersLimit = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["sub-users-limit", user?.id],
    queryFn: async () => {
      if (!user?.id) return { canManage: false, maxUsers: 0, currentCount: 0 };

      const { data: features } = await supabase
        .from("restaurant_features")
        .select("can_manage_sub_users, max_sub_users")
        .eq("restaurant_id", user.id)
        .maybeSingle();

      const { count } = await supabase
        .from("restaurant_sub_users")
        .select("*", { count: "exact", head: true })
        .eq("restaurant_id", user.id);

      return {
        canManage: features?.can_manage_sub_users ?? false,
        maxUsers: features?.max_sub_users ?? 3,
        currentCount: count ?? 0,
      };
    },
    enabled: !!user?.id,
  });
};

// جلب صلاحيات المستخدم الحالي (إذا كان مستخدم فرعي)
export const useMySubUserPermissions = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-sub-user-permissions", user?.id],
    queryFn: async (): Promise<SubUserPermissions | null> => {
      if (!user?.id) return null;

      // التحقق إذا كان المستخدم مستخدم فرعي
      const { data: subUser } = await supabase
        .from("restaurant_sub_users")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (!subUser) return null;

      const { data: permissions } = await supabase
        .from("restaurant_sub_user_permissions")
        .select("*")
        .eq("sub_user_id", subUser.id)
        .maybeSingle();

      return permissions || null;
    },
    enabled: !!user?.id,
  });
};

// جلب فروع المستخدم الفرعي
export const useMySubUserBranches = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-sub-user-branches", user?.id],
    queryFn: async (): Promise<string[]> => {
      if (!user?.id) return [];

      // التحقق إذا كان المستخدم مستخدم فرعي
      const { data: subUser } = await supabase
        .from("restaurant_sub_users")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (!subUser) return [];

      const { data: branches } = await supabase
        .from("restaurant_sub_user_branches")
        .select("branch_id")
        .eq("sub_user_id", subUser.id);

      return branches?.map((b) => b.branch_id) || [];
    },
    enabled: !!user?.id,
  });
};

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

export type AdminOrder = Tables<"orders"> & {
  restaurant_profile?: Tables<"profiles"> | null;
  branch?: Tables<"branches"> | null;
  items?: (Tables<"order_items"> & {
    product?: Tables<"products"> | null;
    supplier_profile?: Tables<"profiles"> | null;
  })[];
};

export type AdminUser = Tables<"profiles"> & {
  role?: string;
  email?: string;
};

// جلب جميع الطلبات للمدير
export const useAdminOrders = () => {
  return useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from("orders")
        .select(`
          *,
          branch:branches(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // جلب معلومات المطاعم
      const restaurantIds = [...new Set(orders?.map(o => o.restaurant_id) || [])];
      const { data: restaurantProfiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", restaurantIds);

      // جلب عناصر الطلبات
      const orderIds = orders?.map(o => o.id) || [];
      const { data: orderItems } = await supabase
        .from("order_items")
        .select(`
          *,
          product:products(*)
        `)
        .in("order_id", orderIds);

      // جلب ملفات الموردين
      const supplierIds = [...new Set(orderItems?.map(i => i.supplier_id) || [])];
      const { data: supplierProfiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", supplierIds);

      // دمج البيانات
      const enrichedOrders = orders?.map(order => ({
        ...order,
        restaurant_profile: restaurantProfiles?.find(p => p.user_id === order.restaurant_id) || null,
        items: orderItems
          ?.filter(item => item.order_id === order.id)
          .map(item => ({
            ...item,
            supplier_profile: supplierProfiles?.find(p => p.user_id === item.supplier_id) || null,
          })) || [],
      })) || [];

      return enrichedOrders as AdminOrder[];
    },
  });
};

// جلب جميع المستخدمين مع الإيميل
export const useAdminUsers = () => {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // استخدام Edge Function لجلب المستخدمين مع الإيميل
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        throw new Error("غير مصرح");
      }

      const response = await supabase.functions.invoke("admin-get-users", {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "خطأ في جلب المستخدمين");
      }

      return response.data as AdminUser[];
    },
  });
};

// إحصائيات المدير
export const useAdminStats = () => {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      // عدد الطلبات
      const { count: ordersCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true });

      // عدد المنتجات
      const { count: productsCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      // جلب الأدوار لحساب المستخدمين
      const { data: allRoles } = await supabase
        .from("user_roles")
        .select("role");

      const restaurantsCount = allRoles?.filter(r => r.role === "restaurant").length || 0;
      const suppliersCount = allRoles?.filter(r => r.role === "supplier").length || 0;

      // إجمالي المبيعات
      const { data: orders } = await supabase
        .from("orders")
        .select("total_amount, delivery_fee");

      const totalSales = orders?.reduce((sum, o) => sum + Number(o.total_amount) + Number(o.delivery_fee), 0) || 0;

      return {
        ordersCount: ordersCount || 0,
        productsCount: productsCount || 0,
        restaurantsCount,
        suppliersCount,
        totalSales,
      };
    },
  });
};

// إدارة التصنيفات
export const useAdminCategories = () => {
  return useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (category: { name: string; icon?: string }) => {
      const { data, error } = await supabase
        .from("categories")
        .insert(category)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "تم إضافة التصنيف بنجاح" });
    },
    onError: (error) => {
      toast({ title: "خطأ في إضافة التصنيف", description: error.message, variant: "destructive" });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...category }: { id: string; name?: string; icon?: string }) => {
      const { data, error } = await supabase
        .from("categories")
        .update(category)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "تم تحديث التصنيف بنجاح" });
    },
    onError: (error) => {
      toast({ title: "خطأ في تحديث التصنيف", description: error.message, variant: "destructive" });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "تم حذف التصنيف بنجاح" });
    },
    onError: (error) => {
      toast({ title: "خطأ في حذف التصنيف", description: error.message, variant: "destructive" });
    },
  });
};

// تسجيل مستخدم جديد (مطعم أو مورد)
export const useAdminCreateUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userData: {
      email: string;
      password: string;
      fullName: string;
      businessName: string;
      phone: string;
      role: "restaurant" | "supplier";
      region?: string;
      supplyCategories?: string[];
    }) => {
      // إنشاء المستخدم عبر Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("فشل في إنشاء المستخدم");

      // إنشاء الملف الشخصي
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          user_id: authData.user.id,
          full_name: userData.fullName,
          business_name: userData.businessName,
          phone: userData.phone,
          region: userData.region || null,
          supply_categories: userData.supplyCategories || null,
        });

      if (profileError) throw profileError;

      // إنشاء الدور
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: authData.user.id,
          role: userData.role,
        });

      if (roleError) throw roleError;

      return authData.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "تم تسجيل المستخدم بنجاح" });
    },
    onError: (error) => {
      toast({ title: "خطأ في تسجيل المستخدم", description: error.message, variant: "destructive" });
    },
  });
};

// تحديث بيانات المستخدم
export const useAdminUpdateUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userData: {
      userId: string;
      fullName?: string;
      businessName?: string;
      phone?: string;
      region?: string;
      supplyCategories?: string[];
    }) => {
      const { userId, ...updateData } = userData;
      
      const profileUpdate: Record<string, unknown> = {};
      if (updateData.fullName) profileUpdate.full_name = updateData.fullName;
      if (updateData.businessName) profileUpdate.business_name = updateData.businessName;
      if (updateData.phone !== undefined) profileUpdate.phone = updateData.phone;
      if (updateData.region !== undefined) profileUpdate.region = updateData.region;
      if (updateData.supplyCategories !== undefined) profileUpdate.supply_categories = updateData.supplyCategories;

      const { error } = await supabase
        .from("profiles")
        .update(profileUpdate)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "تم تحديث بيانات المستخدم بنجاح" });
    },
    onError: (error) => {
      toast({ title: "خطأ في تحديث البيانات", description: error.message, variant: "destructive" });
    },
  });
};

// حذف مستخدم
export const useAdminDeleteUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userId: string) => {
      // حذف الدور أولاً
      const { error: roleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (roleError) throw roleError;

      // حذف الملف الشخصي
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", userId);

      if (profileError) throw profileError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "تم حذف المستخدم بنجاح" });
    },
    onError: (error) => {
      toast({ title: "خطأ في حذف المستخدم", description: error.message, variant: "destructive" });
    },
  });
};

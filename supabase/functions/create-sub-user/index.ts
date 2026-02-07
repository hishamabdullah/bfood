import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface CreateSubUserRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  branch_ids: string[];
  permissions: {
    can_see_prices: boolean;
    can_see_favorite_suppliers_only: boolean;
    can_see_favorite_products_only: boolean;
    can_edit_order: boolean;
    can_cancel_order: boolean;
    can_approve_order: boolean;
    can_see_order_totals: boolean;
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "غير مصرح" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // التحقق من المستخدم الحالي
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: callerUser }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !callerUser) {
      return new Response(
        JSON.stringify({ error: "خطأ في المصادقة" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // التحقق من أن المستخدم مطعم
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerUser.id)
      .single();

    if (!roleData || roleData.role !== "restaurant") {
      return new Response(
        JSON.stringify({ error: "فقط المطاعم يمكنها إنشاء مستخدمين فرعيين" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // التحقق من أن المطعم لديه صلاحية إدارة المستخدمين الفرعيين
    const { data: features } = await supabaseClient
      .from("restaurant_features")
      .select("can_manage_sub_users, max_sub_users")
      .eq("restaurant_id", callerUser.id)
      .single();

    if (!features?.can_manage_sub_users) {
      return new Response(
        JSON.stringify({ error: "خطتك الحالية لا تدعم إضافة مستخدمين فرعيين" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // التحقق من عدد المستخدمين الفرعيين الحاليين
    const { count: currentSubUsers } = await supabaseClient
      .from("restaurant_sub_users")
      .select("*", { count: "exact", head: true })
      .eq("restaurant_id", callerUser.id)
      .eq("is_active", true);

    const maxSubUsers = features.max_sub_users ?? 3;
    if ((currentSubUsers ?? 0) >= maxSubUsers) {
      return new Response(
        JSON.stringify({ 
          error: `وصلت للحد الأقصى من المستخدمين الفرعيين (${maxSubUsers})`,
          current: currentSubUsers,
          max: maxSubUsers
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // استلام البيانات
    const body: CreateSubUserRequest = await req.json();
    const { email, password, full_name, phone, branch_ids, permissions } = body;

    if (!email || !password || !full_name) {
      return new Response(
        JSON.stringify({ error: "البريد الإلكتروني وكلمة المرور والاسم مطلوبة" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // إنشاء المستخدم في auth
    const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = newUser.user.id;

    // إنشاء سجل المستخدم الفرعي
    const { data: subUserData, error: subUserError } = await supabaseClient
      .from("restaurant_sub_users")
      .insert({
        user_id: userId,
        restaurant_id: callerUser.id,
        full_name,
        phone: phone || null,
        is_active: true,
      })
      .select()
      .single();

    if (subUserError) {
      console.error("Sub user creation error:", subUserError);
      // محاولة حذف المستخدم من auth إذا فشل إنشاء السجل
      await supabaseClient.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: "فشل في إنشاء المستخدم الفرعي" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // إنشاء الصلاحيات
    const { error: permError } = await supabaseClient
      .from("restaurant_sub_user_permissions")
      .insert({
        sub_user_id: subUserData.id,
        can_see_prices: permissions?.can_see_prices ?? true,
        can_see_favorite_suppliers_only: permissions?.can_see_favorite_suppliers_only ?? false,
        can_see_favorite_products_only: permissions?.can_see_favorite_products_only ?? false,
        can_edit_order: permissions?.can_edit_order ?? true,
        can_cancel_order: permissions?.can_cancel_order ?? true,
        can_approve_order: permissions?.can_approve_order ?? false,
        can_see_order_totals: permissions?.can_see_order_totals ?? true,
      });

    if (permError) {
      console.error("Permissions creation error:", permError);
    }

    // ربط الفروع إذا وُجدت
    if (branch_ids && branch_ids.length > 0) {
      const branchRecords = branch_ids.map((branch_id) => ({
        sub_user_id: subUserData.id,
        branch_id,
      }));

      const { error: branchError } = await supabaseClient
        .from("restaurant_sub_user_branches")
        .insert(branchRecords);

      if (branchError) {
        console.error("Branch assignment error:", branchError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "تم إنشاء المستخدم الفرعي بنجاح",
        subUserId: subUserData.id,
        userId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "حدث خطأ غير متوقع" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

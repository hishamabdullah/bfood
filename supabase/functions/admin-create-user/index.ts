import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // التحقق من صلاحيات المستخدم الطالب
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "غير مصرح" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    
    // التحقق من أن المستخدم الحالي مدير
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: callerUser }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !callerUser) {
      return new Response(
        JSON.stringify({ error: "خطأ في المصادقة" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // التحقق من دور المدير
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerUser.id)
      .single();

    if (!roleData || roleData.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "ليس لديك صلاحية لإضافة مشرفين" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // استلام البيانات
    const { email, password, fullName, permissions } = await req.json();

    if (!email || !password || !fullName) {
      return new Response(
        JSON.stringify({ error: "البريد الإلكتروني وكلمة المرور والاسم مطلوبة" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // إنشاء المستخدم الجديد
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

    // إنشاء الملف الشخصي
    const { error: profileError } = await supabaseClient
      .from("profiles")
      .insert({
        user_id: userId,
        full_name: fullName,
        business_name: fullName,
        is_approved: true,
      });

    if (profileError) {
      console.error("Profile error:", profileError);
    }

    // إضافة دور المدير
    const { error: roleError } = await supabaseClient
      .from("user_roles")
      .insert({
        user_id: userId,
        role: "admin",
      });

    if (roleError) {
      console.error("Role error:", roleError);
    }

    // إضافة الصلاحيات
    const { error: permError } = await supabaseClient
      .from("admin_permissions")
      .insert({
        user_id: userId,
        can_manage_users: permissions?.users || false,
        can_manage_orders: permissions?.orders || false,
        can_manage_delivery: permissions?.delivery || false,
        can_manage_products: permissions?.products || false,
      });

    if (permError) {
      console.error("Permissions error:", permError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "تم إنشاء المشرف بنجاح",
        userId 
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

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

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

    const { sub_user_id } = await req.json();

    if (!sub_user_id) {
      return new Response(
        JSON.stringify({ error: "معرف المستخدم الفرعي مطلوب" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // التحقق من أن المستخدم الفرعي ينتمي لهذا المطعم
    const { data: subUser, error: subUserError } = await supabaseClient
      .from("restaurant_sub_users")
      .select("user_id")
      .eq("id", sub_user_id)
      .eq("restaurant_id", callerUser.id)
      .single();

    if (subUserError || !subUser) {
      return new Response(
        JSON.stringify({ error: "المستخدم الفرعي غير موجود أو لا تملك صلاحية حذفه" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // حذف الفروع المرتبطة
    await supabaseClient
      .from("restaurant_sub_user_branches")
      .delete()
      .eq("sub_user_id", sub_user_id);

    // حذف الصلاحيات
    await supabaseClient
      .from("restaurant_sub_user_permissions")
      .delete()
      .eq("sub_user_id", sub_user_id);

    // حذف سجل المستخدم الفرعي
    const { error: deleteError } = await supabaseClient
      .from("restaurant_sub_users")
      .delete()
      .eq("id", sub_user_id);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return new Response(
        JSON.stringify({ error: "فشل في حذف المستخدم الفرعي" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // حذف المستخدم من auth
    const { error: authDeleteError } = await supabaseClient.auth.admin.deleteUser(subUser.user_id);

    if (authDeleteError) {
      console.error("Auth delete error:", authDeleteError);
      // لا نُرجع خطأ لأن السجل تم حذفه بنجاح
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "تم حذف المستخدم الفرعي بنجاح",
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

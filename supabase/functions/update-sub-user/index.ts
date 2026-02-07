import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface UpdateSubUserRequest {
  sub_user_id: string;
  full_name?: string;
  phone?: string;
  is_active?: boolean;
  branch_ids?: string[];
  permissions?: {
    can_see_prices?: boolean;
    can_see_favorite_suppliers_only?: boolean;
    can_see_favorite_products_only?: boolean;
    can_edit_order?: boolean;
    can_cancel_order?: boolean;
    can_approve_order?: boolean;
    can_see_order_totals?: boolean;
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

    const body: UpdateSubUserRequest = await req.json();
    const { sub_user_id, full_name, phone, is_active, branch_ids, permissions } = body;

    if (!sub_user_id) {
      return new Response(
        JSON.stringify({ error: "معرف المستخدم الفرعي مطلوب" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // التحقق من أن المستخدم الفرعي ينتمي لهذا المطعم
    const { data: subUser, error: subUserError } = await supabaseClient
      .from("restaurant_sub_users")
      .select("*")
      .eq("id", sub_user_id)
      .eq("restaurant_id", callerUser.id)
      .single();

    if (subUserError || !subUser) {
      return new Response(
        JSON.stringify({ error: "المستخدم الفرعي غير موجود أو لا تملك صلاحية تعديله" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // تحديث بيانات المستخدم الفرعي
    const updateData: Record<string, any> = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (phone !== undefined) updateData.phone = phone;
    if (is_active !== undefined) updateData.is_active = is_active;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabaseClient
        .from("restaurant_sub_users")
        .update(updateData)
        .eq("id", sub_user_id);

      if (updateError) {
        console.error("Update error:", updateError);
        return new Response(
          JSON.stringify({ error: "فشل في تحديث البيانات" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // تحديث الصلاحيات إذا وُجدت
    if (permissions) {
      const { error: permError } = await supabaseClient
        .from("restaurant_sub_user_permissions")
        .update(permissions)
        .eq("sub_user_id", sub_user_id);

      if (permError) {
        console.error("Permissions update error:", permError);
      }
    }

    // تحديث الفروع إذا وُجدت
    if (branch_ids !== undefined) {
      // حذف الفروع القديمة
      await supabaseClient
        .from("restaurant_sub_user_branches")
        .delete()
        .eq("sub_user_id", sub_user_id);

      // إضافة الفروع الجديدة
      if (branch_ids.length > 0) {
        const branchRecords = branch_ids.map((branch_id) => ({
          sub_user_id,
          branch_id,
        }));

        const { error: branchError } = await supabaseClient
          .from("restaurant_sub_user_branches")
          .insert(branchRecords);

        if (branchError) {
          console.error("Branch assignment error:", branchError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "تم تحديث المستخدم الفرعي بنجاح",
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

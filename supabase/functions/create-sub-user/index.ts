import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateSubUserRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  permissions: {
    can_see_prices: boolean;
    can_see_favorite_suppliers_only: boolean;
    can_see_favorite_products_only: boolean;
    can_edit_order: boolean;
    can_cancel_order: boolean;
    can_approve_order: boolean;
    can_see_order_totals: boolean;
  };
  branch_ids: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Admin client for creating users
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Regular client to verify the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "غير مصرح - يجب تسجيل الدخول" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the calling user
    const { data: { user: caller }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !caller) {
      return new Response(
        JSON.stringify({ error: "غير مصرح" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if caller is a restaurant owner
    const { data: callerRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .single();

    if (!callerRole || callerRole.role !== "restaurant") {
      return new Response(
        JSON.stringify({ error: "غير مصرح - يجب أن تكون مدير مطعم" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if restaurant has the feature enabled
    const { data: features } = await supabaseAdmin
      .from("restaurant_features")
      .select("can_manage_sub_users, max_sub_users")
      .eq("restaurant_id", caller.id)
      .maybeSingle();

    if (!features?.can_manage_sub_users) {
      return new Response(
        JSON.stringify({ error: "ميزة إدارة المستخدمين غير مفعلة لحسابك" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check current sub-users count
    const { count: currentCount } = await supabaseAdmin
      .from("restaurant_sub_users")
      .select("*", { count: "exact", head: true })
      .eq("restaurant_id", caller.id);

    const maxUsers = features.max_sub_users ?? 3;
    if ((currentCount ?? 0) >= maxUsers) {
      return new Response(
        JSON.stringify({ error: `لقد وصلت للحد الأقصى من المستخدمين (${maxUsers})` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: CreateSubUserRequest = await req.json();

    // Validate required fields
    if (!body.email || !body.password || !body.full_name) {
      return new Response(
        JSON.stringify({ error: "البريد الإلكتروني وكلمة المرور والاسم مطلوبين" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user with Admin API (doesn't affect current session)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true, // Auto-confirm email for sub-users
      user_metadata: {
        full_name: body.full_name,
        is_sub_user: true,
        parent_restaurant_id: caller.id,
      },
    });

    if (authError) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: "فشل في إنشاء المستخدم" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newUserId = authData.user.id;

    // Create sub-user record
    const { data: subUser, error: subUserError } = await supabaseAdmin
      .from("restaurant_sub_users")
      .insert({
        restaurant_id: caller.id,
        user_id: newUserId,
        full_name: body.full_name,
        phone: body.phone || null,
        is_active: true,
      })
      .select()
      .single();

    if (subUserError) {
      console.error("Sub-user error:", subUserError);
      // Clean up: delete the auth user if sub-user creation fails
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return new Response(
        JSON.stringify({ error: "فشل في إنشاء سجل المستخدم" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create permissions
    const { error: permError } = await supabaseAdmin
      .from("restaurant_sub_user_permissions")
      .insert({
        sub_user_id: subUser.id,
        ...body.permissions,
      });

    if (permError) {
      console.error("Permissions error:", permError);
    }

    // Assign branches
    if (body.branch_ids && body.branch_ids.length > 0) {
      const branchInserts = body.branch_ids.map((branch_id) => ({
        sub_user_id: subUser.id,
        branch_id,
      }));

      const { error: branchError } = await supabaseAdmin
        .from("restaurant_sub_user_branches")
        .insert(branchInserts);

      if (branchError) {
        console.error("Branch assignment error:", branchError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sub_user: subUser,
        message: "تم إنشاء المستخدم بنجاح" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "حدث خطأ غير متوقع" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

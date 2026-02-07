import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useSubUserContext } from "@/hooks/useSubUserContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Store, Phone, Shield, Building } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface RestaurantInfo {
  business_name: string;
  full_name: string;
  phone: string | null;
}

interface SubUserInfo {
  full_name: string;
  email: string | null;
  phone: string | null;
}

const SubUserProfileView = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: subUserContext, isLoading: contextLoading } = useSubUserContext();

  // جلب بيانات المطعم الأب
  const { data: restaurantInfo, isLoading: restaurantLoading } = useQuery({
    queryKey: ["restaurant-info", subUserContext?.restaurantId],
    queryFn: async (): Promise<RestaurantInfo | null> => {
      if (!subUserContext?.restaurantId) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("business_name, full_name, phone")
        .eq("user_id", subUserContext.restaurantId)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching restaurant info:", error);
        return null;
      }
      
      return data;
    },
    enabled: !!subUserContext?.restaurantId,
  });

  // جلب بيانات الموظف
  const { data: subUserInfo, isLoading: subUserLoading } = useQuery({
    queryKey: ["sub-user-info", user?.id],
    queryFn: async (): Promise<SubUserInfo | null> => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("restaurant_sub_users")
        .select("full_name, email, phone")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching sub user info:", error);
        return null;
      }
      
      return data;
    },
    enabled: !!user?.id,
  });

  const isLoading = contextLoading || restaurantLoading || subUserLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const permissions = subUserContext?.permissions;

  return (
    <div className="space-y-6">
      {/* بيانات الموظف */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            بياناتي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">الاسم</p>
              <p className="font-medium">{subUserInfo?.full_name || "—"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
              <p className="font-medium" dir="ltr">{user?.email || subUserInfo?.email || "—"}</p>
            </div>
          </div>

          {subUserInfo?.phone && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                <p className="font-medium" dir="ltr">{subUserInfo.phone}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* بيانات المطعم */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            بيانات المطعم
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <Building className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">اسم المطعم</p>
              <p className="font-bold text-lg">{restaurantInfo?.business_name || "—"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">اسم المدير</p>
              <p className="font-medium">{restaurantInfo?.full_name || "—"}</p>
            </div>
          </div>

          {restaurantInfo?.phone && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">هاتف المدير</p>
                <p className="font-medium" dir="ltr">{restaurantInfo.phone}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* الصلاحيات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            صلاحياتي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {permissions?.can_see_prices && (
              <Badge variant="secondary">رؤية الأسعار</Badge>
            )}
            {permissions?.can_see_order_totals && (
              <Badge variant="secondary">رؤية الإجماليات</Badge>
            )}
            {permissions?.can_edit_order && (
              <Badge variant="secondary">تعديل الطلبات</Badge>
            )}
            {permissions?.can_cancel_order && (
              <Badge variant="secondary">إلغاء الطلبات</Badge>
            )}
            {permissions?.can_approve_order && (
              <Badge variant="secondary">الموافقة على الطلبات</Badge>
            )}
            {permissions?.can_view_analytics && (
              <Badge variant="secondary">رؤية التقارير</Badge>
            )}
            {permissions?.can_manage_branches && (
              <Badge variant="secondary">إدارة الفروع</Badge>
            )}
            {permissions?.can_manage_templates && (
              <Badge variant="secondary">قوالب الطلبات</Badge>
            )}
            {permissions?.can_see_favorite_suppliers_only && (
              <Badge variant="outline">موردين مفضلين فقط</Badge>
            )}
            {permissions?.can_see_favorite_products_only && (
              <Badge variant="outline">منتجات مفضلة فقط</Badge>
            )}
          </div>
          
          {!permissions && (
            <p className="text-muted-foreground text-sm">لم يتم تحديد صلاحيات</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubUserProfileView;

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Hash, Building2, Loader2 } from "lucide-react";

interface AccountManagerInfoProps {
  restaurantId: string;
}

interface ManagerData {
  full_name: string;
  business_name: string;
  customer_code: string | null;
  email: string | null;
}

const AccountManagerInfo = ({ restaurantId }: AccountManagerInfoProps) => {
  const { t } = useTranslation();

  const { data: managerData, isLoading } = useQuery({
    queryKey: ["account-manager", restaurantId],
    queryFn: async (): Promise<ManagerData | null> => {
      // جلب بيانات المطعم الأصلي
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, business_name, customer_code")
        .eq("user_id", restaurantId)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) return null;

      // جلب الإيميل من auth عبر edge function
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return { ...profile, email: null };

      try {
        const response = await supabase.functions.invoke("get-user-email", {
          body: { userId: restaurantId },
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
        });
        
        return {
          ...profile,
          email: response.data?.email || null,
        };
      } catch {
        return { ...profile, email: null };
      }
    },
    enabled: !!restaurantId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!managerData) return null;

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-5 w-5 text-primary" />
          {t("profile.accountManager", "مدير الحساب")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* اسم المدير */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("profile.fullName", "الاسم")}</p>
            <p className="font-medium">{managerData.full_name}</p>
          </div>
        </div>

        {/* البريد الإلكتروني */}
        {managerData.email && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("profile.email", "البريد الإلكتروني")}</p>
              <p className="font-medium text-sm" dir="ltr">{managerData.email}</p>
            </div>
          </div>
        )}

        {/* رقم العميل */}
        {managerData.customer_code && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Hash className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("profile.customerCode", "رقم العميل")}</p>
              <Badge variant="outline" className="font-mono text-primary">
                #{managerData.customer_code}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AccountManagerInfo;

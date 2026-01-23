import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Clock, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PendingApproval = () => {
  const { user, signOut, loading, isApproved, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login");
      } else if (isApproved || userRole === "admin") {
        navigate("/dashboard");
      }
    }
  }, [user, loading, isApproved, userRole, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <CardTitle className="text-2xl">في انتظار الموافقة</CardTitle>
          <CardDescription className="text-base">
            تم تسجيل حسابك بنجاح! يرجى الانتظار حتى يقوم المدير بمراجعة حسابك والموافقة عليه.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              سيتم إعلامك عند الموافقة على حسابك. يمكنك التواصل معنا للاستفسار:
            </p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <a href="mailto:support@bfood.io" className="flex items-center gap-1 text-primary hover:underline">
                <Mail className="w-4 h-4" />
                support@bfood.io
              </a>
            </div>
          </div>
          
          <Button variant="outline" onClick={handleSignOut} className="w-full">
            تسجيل الخروج
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApproval;

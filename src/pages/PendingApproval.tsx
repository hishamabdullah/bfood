import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { Clock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PendingApproval = () => {
  const { user, signOut, loading, isApproved, userRole } = useAuth();
  const navigate = useNavigate();
  const bellAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    bellAudioRef.current = new Audio("/sounds/notification-bell.mp3");
    bellAudioRef.current.load();

    return () => {
      bellAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login");
      } else if (userRole !== "restaurant") {
        // الموردين والمدراء لا يحتاجون موافقة
        navigate("/dashboard");
      } else if (isApproved) {
        // المطعم معتمد، يذهب للداشبورد
        navigate("/dashboard");
      }
    }
  }, [user, loading, isApproved, userRole, navigate]);

  // Listen for approval in real-time
  useEffect(() => {
    if (!user || userRole !== "restaurant") return;

    const channel = supabase
      .channel("pending-approval-listener")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedProfile = payload.new as { is_approved: boolean };
          
          if (updatedProfile.is_approved) {
            // Play bell sound
            bellAudioRef.current?.play().catch(console.error);
            
            // Show success toast
            toast.success("تمت الموافقة على حسابك!", {
              description: "جاري تحويلك إلى لوحة التحكم...",
            });
            
            // Navigate to dashboard after a short delay
            setTimeout(() => {
              navigate("/dashboard");
              // Force reload to update auth context
              window.location.reload();
            }, 1500);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userRole, navigate]);

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
            تم تسجيل حساب مطعمك بنجاح! يرجى الانتظار حتى يقوم المدير بمراجعة حسابك والموافقة عليه.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              سيتم إعلامك تلقائياً عند الموافقة على حسابك وتحويلك إلى لوحة التحكم. يمكنك التواصل معنا للاستفسار:
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

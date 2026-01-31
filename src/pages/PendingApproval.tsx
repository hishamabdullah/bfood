import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Clock, Mail, CheckCircle2, PartyPopper, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

const PendingApproval = () => {
  const { user, signOut, loading, isApproved, userRole } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const bellAudioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showApprovalAnimation, setShowApprovalAnimation] = useState(false);

  // Initialize audio - using payment chime for softer sound
  useEffect(() => {
    const bellAudio = new Audio("/sounds/payment-chime.mp3");
    bellAudio.load();
    bellAudio.volume = 0.5;
    bellAudioRef.current = bellAudio;

    return () => {
      if (bellAudioRef.current) {
        bellAudioRef.current.pause();
        bellAudioRef.current.src = "";
        bellAudioRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login");
      } else if (userRole === "admin") {
        navigate("/dashboard");
      } else if (isApproved) {
        navigate("/dashboard");
      }
    }
  }, [user, loading, isApproved, userRole, navigate]);

  // Listen for approval in real-time
  useEffect(() => {
    if (!user || userRole === "admin") return;

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
            setShowApprovalAnimation(true);
            bellAudioRef.current?.play().catch(console.error);
            
            timeoutRef.current = setTimeout(() => {
              navigate("/dashboard");
              window.location.reload();
            }, 3000);
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
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Approval celebration animation
  if (showApprovalAnimation) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4 overflow-hidden" dir={isRtl ? "rtl" : "ltr"}>
        {/* Confetti particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-20px`,
                animationDelay: `${Math.random() * 1}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <Sparkles 
                className="text-primary" 
                style={{ 
                  color: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'][i % 5],
                  transform: `rotate(${Math.random() * 360}deg)`,
                  width: `${16 + Math.random() * 16}px`,
                  height: `${16 + Math.random() * 16}px`,
                }} 
              />
            </div>
          ))}
        </div>

        <Card className="w-full max-w-md text-center relative z-10 animate-scale-in border-2 border-green-200 shadow-2xl shadow-green-100">
          <CardHeader className="space-y-6 pt-8">
            {/* Success icon with pulse animation */}
            <div className="mx-auto relative">
              <div className="absolute inset-0 w-24 h-24 mx-auto bg-green-400/30 rounded-full animate-ping" />
              <div className="relative w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg animate-bounce-slow">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>
            </div>
            
            {/* Party icon */}
            <div className="flex justify-center gap-4">
              <PartyPopper className="w-8 h-8 text-amber-500 animate-wiggle" />
              <PartyPopper className="w-8 h-8 text-pink-500 animate-wiggle" style={{ animationDelay: '0.2s' }} />
            </div>

            <CardTitle className="text-3xl font-bold text-green-600 animate-fade-in">
              {t("pendingApproval.congratulations")} 🎉
            </CardTitle>
            <CardDescription className="text-lg text-foreground animate-fade-in" style={{ animationDelay: '0.3s' }}>
              {t("pendingApproval.approved")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <div className="flex items-center justify-center gap-2 text-muted-foreground animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <p>{t("pendingApproval.redirecting")}</p>
            </div>
          </CardContent>
        </Card>

        <style>{`
          @keyframes confetti {
            0% {
              transform: translateY(0) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) rotate(720deg);
              opacity: 0;
            }
          }
          
          @keyframes scale-in {
            0% {
              transform: scale(0.5);
              opacity: 0;
            }
            50% {
              transform: scale(1.05);
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
          
          @keyframes bounce-slow {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
          }
          
          @keyframes wiggle {
            0%, 100% {
              transform: rotate(-15deg);
            }
            50% {
              transform: rotate(15deg);
            }
          }
          
          @keyframes fade-in {
            0% {
              opacity: 0;
              transform: translateY(10px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .animate-confetti {
            animation: confetti linear forwards;
          }
          
          .animate-scale-in {
            animation: scale-in 0.6s ease-out forwards;
          }
          
          .animate-bounce-slow {
            animation: bounce-slow 2s ease-in-out infinite;
          }
          
          .animate-wiggle {
            animation: wiggle 0.5s ease-in-out infinite;
          }
          
          .animate-fade-in {
            animation: fade-in 0.5s ease-out forwards;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4" dir={isRtl ? "rtl" : "ltr"}>
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <CardTitle className="text-2xl">{t("pendingApproval.title")}</CardTitle>
          <CardDescription className="text-base">
            {t("pendingApproval.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              {t("pendingApproval.autoNotify")}
            </p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <a href="mailto:support@bfood.io" className="flex items-center gap-1 text-primary hover:underline">
                <Mail className="w-4 h-4" />
                support@bfood.io
              </a>
            </div>
          </div>
          
          <Button variant="outline" onClick={handleSignOut} className="w-full">
            {t("pendingApproval.signOut")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApproval;

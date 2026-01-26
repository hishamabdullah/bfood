import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2 } from "lucide-react";

interface LoginLoadingOverlayProps {
  isVisible: boolean;
}

const LoginLoadingOverlay = ({ isVisible }: LoginLoadingOverlayProps) => {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);

  const steps = [
    t("auth.loadingSteps.verifying", "جاري التحقق من البيانات..."),
    t("auth.loadingSteps.authenticating", "جاري المصادقة..."),
    t("auth.loadingSteps.loading", "جاري تحميل ملفك الشخصي..."),
    t("auth.loadingSteps.preparing", "جاري تجهيز لوحة التحكم..."),
  ];

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setStep(0);
      return;
    }

    // تقدم سريع في البداية ثم يبطئ
    const intervals = [
      { target: 30, duration: 300 },
      { target: 55, duration: 400 },
      { target: 75, duration: 500 },
      { target: 90, duration: 800 },
    ];

    let currentInterval = 0;
    
    const progressInterval = setInterval(() => {
      if (currentInterval < intervals.length) {
        const { target } = intervals[currentInterval];
        setProgress(target);
        setStep(currentInterval);
        currentInterval++;
      }
    }, 400);

    return () => clearInterval(progressInterval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm mx-4 space-y-8">
        {/* Logo Animation */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary shadow-lg animate-pulse">
              <span className="text-4xl font-bold text-primary-foreground">B</span>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-foreground">BFOOD</h2>
        </div>

        {/* Progress Section */}
        <div className="space-y-4 bg-card rounded-2xl p-6 shadow-elevated border">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("auth.loggingIn", "جاري تسجيل الدخول")}</span>
              <span className="text-primary font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Steps */}
          <div className="space-y-3 pt-2">
            {steps.map((stepText, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 transition-all duration-300 ${
                  index <= step ? "opacity-100" : "opacity-40"
                }`}
              >
                {index < step ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                ) : index === step ? (
                  <Loader2 className="h-5 w-5 text-primary animate-spin flex-shrink-0" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-muted flex-shrink-0" />
                )}
                <span
                  className={`text-sm ${
                    index === step ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}
                >
                  {stepText}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Text */}
        <p className="text-center text-sm text-muted-foreground">
          {t("auth.pleaseWait", "يرجى الانتظار قليلاً...")}
        </p>
      </div>
    </div>
  );
};

export default LoginLoadingOverlay;

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Mail, Phone, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormData } from "./types";

interface Step4AccountProps {
  formData: FormData;
  onChange: (data: Partial<FormData>) => void;
  onSubmit: () => void;
  onBack: () => void;
  isLoading: boolean;
}

const Step4Account = ({ formData, onChange, onSubmit, onBack, isLoading }: Step4AccountProps) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const ArrowBackIcon = isRTL ? ArrowRight : ArrowLeft;
  const [showPassword, setShowPassword] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const isValidPhone = formData.phone.length >= 10;
  const isValidPassword = formData.password.length >= 6;
  const isValid = isValidEmail && isValidPhone && isValidPassword;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-sm font-medium mb-2">
          <ShieldCheck className="h-4 w-4" />
          {isRTL ? "الخطوة الأخيرة" : "Final Step"}
        </div>
        <h2 className="text-2xl font-bold">{isRTL ? "بيانات الدخول" : "Account Credentials"}</h2>
        <p className="text-muted-foreground">
          {isRTL ? "أنشئ بيانات الدخول لحسابك" : "Create your login credentials"}
        </p>
      </div>

      <div className="space-y-4">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            {t("auth.email")}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="example@email.com"
            value={formData.email}
            onChange={(e) => onChange({ email: e.target.value })}
            className="h-12"
            dir="ltr"
            disabled={isLoading}
          />
          {formData.email && !isValidEmail && (
            <p className="text-xs text-destructive">
              {isRTL ? "البريد الإلكتروني غير صالح" : "Invalid email address"}
            </p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            {t("auth.phone")}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="05XXXXXXXX"
            value={formData.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            className="h-12"
            dir="ltr"
            disabled={isLoading}
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password" className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            {t("auth.password")}
            <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => onChange({ password: e.target.value })}
              className="h-12 pr-12"
              dir="ltr"
              disabled={isLoading}
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {formData.password && !isValidPassword && (
            <p className="text-xs text-destructive">
              {isRTL ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل" : "Password must be at least 6 characters"}
            </p>
          )}
        </div>

        {/* Password strength indicator */}
        {formData.password && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    formData.password.length >= level * 3
                      ? level <= 2 ? "bg-destructive" : level === 3 ? "bg-yellow-500" : "bg-primary"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {formData.password.length < 6 
                ? (isRTL ? "ضعيفة جداً" : "Too weak")
                : formData.password.length < 9
                ? (isRTL ? "متوسطة" : "Medium")
                : formData.password.length < 12
                ? (isRTL ? "جيدة" : "Good")
                : (isRTL ? "قوية" : "Strong")
              }
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button 
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1 h-12 gap-2"
          disabled={isLoading}
        >
          <ArrowBackIcon className="h-4 w-4" />
          {isRTL ? "السابق" : "Back"}
        </Button>
        <Button 
          onClick={onSubmit}
          disabled={!isValid || isLoading}
          className="flex-1 h-12 gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {t("auth.creatingAccount")}
            </>
          ) : (
            t("auth.createAccount")
          )}
        </Button>
      </div>
    </div>
  );
};

export default Step4Account;

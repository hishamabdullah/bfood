import { useTranslation } from "react-i18next";
import { Store, Truck, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UserType } from "./types";

interface Step1UserTypeProps {
  userType: UserType;
  onUserTypeChange: (type: UserType) => void;
  onNext: () => void;
}

const Step1UserType = ({ userType, onUserTypeChange, onNext }: Step1UserTypeProps) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const options = [
    {
      type: "restaurant" as UserType,
      icon: Store,
      title: t("auth.restaurant"),
      description: isRTL 
        ? "أنا صاحب مطعم وأبحث عن موردين موثوقين" 
        : "I'm a restaurant owner looking for reliable suppliers",
      features: isRTL 
        ? ["تصفح مئات الموردين", "طلب سهل وسريع", "تتبع الطلبات"] 
        : ["Browse hundreds of suppliers", "Easy and fast ordering", "Track orders"],
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30",
    },
    {
      type: "supplier" as UserType,
      icon: Truck,
      title: t("auth.supplier"),
      description: isRTL 
        ? "أنا مورد وأريد عرض منتجاتي للمطاعم" 
        : "I'm a supplier and want to showcase my products to restaurants",
      features: isRTL 
        ? ["عرض منتجاتك", "إدارة الطلبات", "الوصول لمطاعم أكثر"] 
        : ["Showcase your products", "Manage orders", "Reach more restaurants"],
      gradient: "from-orange-500 to-orange-600",
      bgGradient: "from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-sm font-medium mb-2">
          <Sparkles className="h-4 w-4" />
          {isRTL ? "الخطوة الأولى" : "Step 1"}
        </div>
        <h2 className="text-2xl font-bold">{isRTL ? "ما نوع حسابك؟" : "What type of account?"}</h2>
        <p className="text-muted-foreground">
          {isRTL ? "اختر نوع نشاطك التجاري" : "Choose your business type"}
        </p>
      </div>

      <div className="grid gap-4">
        {options.map((option) => {
          const isSelected = userType === option.type;
          return (
            <button
              key={option.type}
              type="button"
              onClick={() => onUserTypeChange(option.type)}
              className={cn(
                "relative group p-6 rounded-2xl border-2 text-start transition-all duration-300",
                isSelected 
                  ? `border-primary bg-gradient-to-br ${option.bgGradient} shadow-lg` 
                  : "border-border hover:border-primary/50 hover:shadow-md bg-card"
              )}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-4 end-4 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className={cn(
                  "h-14 w-14 rounded-xl flex items-center justify-center bg-gradient-to-br shrink-0",
                  option.gradient
                )}>
                  <option.icon className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold mb-1">{option.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{option.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {option.features.map((feature, i) => (
                      <span 
                        key={i}
                        className={cn(
                          "text-xs px-2 py-1 rounded-full",
                          isSelected 
                            ? "bg-primary/20 text-primary" 
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Button 
        onClick={onNext}
        className="w-full h-12 text-base gap-2 group"
        size="lg"
      >
        {isRTL ? "التالي" : "Next"}
        <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
      </Button>
    </div>
  );
};

export default Step1UserType;

import { useTranslation } from "react-i18next";
import { UserPlus, Search, ShoppingBag, Truck } from "lucide-react";

const HowItWorksSection = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const steps = [
    {
      icon: UserPlus,
      number: "01",
      titleKey: "home.createAccount",
      descKey: "home.createAccountDesc"
    },
    {
      icon: Search,
      number: "02",
      titleKey: "home.browseProductsStep",
      descKey: "home.browseProductsStepDesc"
    },
    {
      icon: ShoppingBag,
      number: "03",
      titleKey: "home.addToCart",
      descKey: "home.addToCartDesc"
    },
    {
      icon: Truck,
      number: "04",
      titleKey: "home.receiveOrder",
      descKey: "home.receiveOrderDesc"
    }
  ];

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            {t("home.howPlatformWorks")} <span className="text-gradient-primary">{t("home.platform")}</span>؟
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl">
            {t("home.fourSimpleSteps")}
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector Line - Desktop */}
          <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
            {steps.map((step, index) => (
              <div 
                key={step.number}
                className="relative text-center animate-fade-in"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                {/* Icon */}
                <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-3xl gradient-primary mb-6 shadow-elevated mx-auto">
                  <step.icon className="h-10 w-10 text-primary-foreground" />
                  <span className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-secondary text-secondary-foreground text-sm font-bold flex items-center justify-center shadow-lg">
                    {step.number}
                  </span>
                </div>
                
                <h3 className="text-xl font-semibold mb-3">{t(step.titleKey)}</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">{t(step.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
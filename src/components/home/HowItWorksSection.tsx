import { useTranslation } from "react-i18next";
import { UserPlus, Search, ShoppingBag, Truck } from "lucide-react";

const HowItWorksSection = () => {
  const { t } = useTranslation();

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
    <section className="py-20 bg-muted/30">
      <div className="container">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("home.howPlatformWorks")} <span className="text-gradient-primary">{t("home.platform")}</span>؟
          </h2>
          <p className="text-muted-foreground text-lg">
            {t("home.fourSimpleSteps")}
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div 
              key={step.number}
              className="relative text-center animate-fade-in"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-0 w-full h-0.5 bg-border -translate-x-1/2" />
              )}
              
              {/* Icon */}
              <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary mb-4 shadow-elevated">
                <step.icon className="h-8 w-8 text-primary-foreground" />
                <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-secondary text-secondary-foreground text-sm font-bold flex items-center justify-center">
                  {step.number}
                </span>
              </div>
              
              <h3 className="text-xl font-semibold mb-2">{t(step.titleKey)}</h3>
              <p className="text-muted-foreground">{t(step.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;

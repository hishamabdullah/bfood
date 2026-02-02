import { useTranslation } from "react-i18next";
import { TrendingDown, Clock, ShieldCheck, Zap } from "lucide-react";

const BenefitsSection = () => {
  const { t } = useTranslation();

  const benefits = [
    {
      icon: TrendingDown,
      stat: "30%",
      titleKey: "home.benefitSavings",
      descKey: "home.benefitSavingsDesc"
    },
    {
      icon: Clock,
      stat: "5x",
      titleKey: "home.benefitTime",
      descKey: "home.benefitTimeDesc"
    },
    {
      icon: ShieldCheck,
      stat: "100%",
      titleKey: "home.benefitControl",
      descKey: "home.benefitControlDesc"
    },
    {
      icon: Zap,
      stat: "24/7",
      titleKey: "home.benefitAccess",
      descKey: "home.benefitAccessDesc"
    }
  ];

  return (
    <section className="py-20 md:py-28 bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
      
      <div className="container relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            {t("home.benefitsTitle")} <span className="text-gradient-primary">{t("home.benefitsHighlight")}</span>
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl">
            {t("home.benefitsSubtitle")}
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <div 
              key={benefit.titleKey}
              className="text-center animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon with stat */}
              <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-3xl gradient-primary mb-6 shadow-elevated">
                <benefit.icon className="h-10 w-10 text-primary-foreground" />
                <span className="absolute -top-2 -right-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-bold">
                  {benefit.stat}
                </span>
              </div>
              
              <h3 className="text-xl font-semibold mb-3">{t(benefit.titleKey)}</h3>
              <p className="text-muted-foreground">{t(benefit.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
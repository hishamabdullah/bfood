import { useTranslation } from "react-i18next";
import { ShoppingCart, Truck, Shield, Clock, CreditCard, Headphones } from "lucide-react";

const FeaturesSection = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: ShoppingCart,
      titleKey: "home.unifiedCart",
      descKey: "home.unifiedCartDesc"
    },
    {
      icon: Truck,
      titleKey: "home.fastDelivery",
      descKey: "home.fastDeliveryDesc"
    },
    {
      icon: Shield,
      titleKey: "home.guaranteedQuality",
      descKey: "home.guaranteedQualityDesc"
    },
    {
      icon: Clock,
      titleKey: "home.orderTracking",
      descKey: "home.orderTrackingDesc"
    },
    {
      icon: CreditCard,
      titleKey: "home.securePayment",
      descKey: "home.securePaymentDesc"
    },
    {
      icon: Headphones,
      titleKey: "home.continuousSupport",
      descKey: "home.continuousSupportDesc"
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("home.whyBfood")} <span className="text-gradient-primary">BFOOD</span>؟
          </h2>
          <p className="text-muted-foreground text-lg">
            {t("home.featuresSubtitle")}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={feature.titleKey}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-card transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t(feature.titleKey)}</h3>
              <p className="text-muted-foreground">{t(feature.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

import { useTranslation } from "react-i18next";
import { 
  ShoppingCart, 
  BarChart3, 
  FileText, 
  Building2, 
  Bell, 
  Heart,
  Clock,
  Truck
} from "lucide-react";

const FeaturesSection = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: ShoppingCart,
      titleKey: "home.unifiedCart",
      descKey: "home.unifiedCartDesc",
      color: "bg-primary/10 text-primary"
    },
    {
      icon: FileText,
      titleKey: "home.orderTemplatesFeature",
      descKey: "home.orderTemplatesFeatureDesc",
      color: "bg-green-500/10 text-green-600"
    },
    {
      icon: BarChart3,
      titleKey: "home.spendAnalyticsFeature",
      descKey: "home.spendAnalyticsFeatureDesc",
      color: "bg-blue-500/10 text-blue-600"
    },
    {
      icon: Building2,
      titleKey: "home.branchManagement",
      descKey: "home.branchManagementDesc",
      color: "bg-purple-500/10 text-purple-600"
    },
    {
      icon: Bell,
      titleKey: "home.instantNotifications",
      descKey: "home.instantNotificationsDesc",
      color: "bg-amber-500/10 text-amber-600"
    },
    {
      icon: Heart,
      titleKey: "home.favoriteSuppliers",
      descKey: "home.favoriteSuppliersDesc",
      color: "bg-rose-500/10 text-rose-600"
    },
    {
      icon: Clock,
      titleKey: "home.orderTracking",
      descKey: "home.orderTrackingDesc",
      color: "bg-teal-500/10 text-teal-600"
    },
    {
      icon: Truck,
      titleKey: "home.flexibleDelivery",
      descKey: "home.flexibleDeliveryDesc",
      color: "bg-indigo-500/10 text-indigo-600"
    }
  ];

  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <span className="text-sm font-medium">{t("home.forRestaurants")}</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            {t("home.featuresTitle")} <span className="text-gradient-primary">{t("home.featuresHighlight")}</span>
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl">
            {t("home.featuresSubtitleNew")}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div 
              key={feature.titleKey}
              className="group relative p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="h-7 w-7" />
              </div>
              
              {/* Content */}
              <h3 className="text-lg font-semibold mb-2">{t(feature.titleKey)}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{t(feature.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Store, Truck } from "lucide-react";

const HeroSection = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <section className="relative overflow-hidden gradient-hero">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 right-20 w-72 h-72 rounded-full bg-primary blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 rounded-full bg-secondary blur-3xl" />
      </div>

      <div className="container relative py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6 animate-fade-in">
            <span className="text-sm font-medium">{t("home.heroBadge")}</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            {t("home.heroMainTitle")}{" "}
            <span className="text-gradient-primary">{t("home.heroHighlight")}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
            {t("home.heroDescription")}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Link to="/register?type=restaurant">
              <Button variant="hero" size="xl" className="w-full sm:w-auto">
                <Store className="h-5 w-5" />
                {t("home.registerAsRestaurant")}
                <Arrow className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/register?type=supplier">
              <Button variant="hero-outline" size="xl" className="w-full sm:w-auto">
                <Truck className="h-5 w-5" />
                {t("home.registerAsSupplier")}
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 md:gap-12 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">+500</div>
              <div className="text-sm text-muted-foreground">{t("home.registeredRestaurants")}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-secondary mb-1">+200</div>
              <div className="text-sm text-muted-foreground">{t("home.trustedSuppliers")}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">+10K</div>
              <div className="text-sm text-muted-foreground">{t("home.monthlyOrders")}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Store, Truck, CheckCircle2 } from "lucide-react";

const HeroSection = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  const heroPoints = [
    t("home.heroPoint1"),
    t("home.heroPoint2"),
    t("home.heroPoint3"),
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 min-h-[90vh] flex items-center">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-20 left-20 w-[600px] h-[600px] rounded-full bg-secondary/10 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:60px_60px] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]" />

      <div className="container relative py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-start order-2 lg:order-1">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-sm font-medium">{t("home.heroBadge")}</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              {t("home.heroMainTitle")}
              <br />
              <span className="text-gradient-primary">{t("home.heroHighlight")}</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              {t("home.heroDescription")}
            </p>

            {/* Hero Points */}
            <div className="flex flex-col gap-3 mb-8 animate-fade-in" style={{ animationDelay: "0.25s" }}>
              {heroPoints.map((point, index) => (
                <div key={index} className="flex items-center gap-3 justify-center lg:justify-start">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-muted-foreground">{point}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <Link to="/register?type=restaurant">
                <Button variant="hero" size="xl" className="w-full sm:w-auto shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
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
          </div>

          {/* Visual Element */}
          <div className="relative order-1 lg:order-2 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Main Card */}
              <div className="relative bg-card/80 backdrop-blur-xl rounded-3xl border border-border/50 p-6 shadow-2xl">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 rounded-2xl bg-primary/5 border border-primary/10">
                    <div className="text-3xl md:text-4xl font-bold text-primary mb-1">+500</div>
                    <div className="text-xs text-muted-foreground">{t("home.registeredRestaurants")}</div>
                  </div>
                  <div className="text-center p-4 rounded-2xl bg-secondary/10 border border-secondary/20">
                    <div className="text-3xl md:text-4xl font-bold text-secondary mb-1">+200</div>
                    <div className="text-xs text-muted-foreground">{t("home.trustedSuppliers")}</div>
                  </div>
                  <div className="text-center p-4 rounded-2xl bg-primary/5 border border-primary/10">
                    <div className="text-3xl md:text-4xl font-bold text-primary mb-1">+10K</div>
                    <div className="text-xs text-muted-foreground">{t("home.monthlyOrders")}</div>
                  </div>
                </div>

                {/* Feature Preview */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/50">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{t("home.orderTemplates")}</div>
                      <div className="text-xs text-muted-foreground">{t("home.orderTemplatesDesc")}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/50">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{t("home.spendAnalytics")}</div>
                      <div className="text-xs text-muted-foreground">{t("home.spendAnalyticsDesc")}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/50">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{t("home.multiSupplier")}</div>
                      <div className="text-xs text-muted-foreground">{t("home.multiSupplierDesc")}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -left-4 w-20 h-20 rounded-2xl bg-primary/20 backdrop-blur-sm border border-primary/30 flex items-center justify-center animate-bounce-slow">
                <Store className="h-8 w-8 text-primary" />
              </div>
              <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-2xl bg-secondary/20 backdrop-blur-sm border border-secondary/30 flex items-center justify-center animate-bounce-slow" style={{ animationDelay: "0.5s" }}>
                <Truck className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
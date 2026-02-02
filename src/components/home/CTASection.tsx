import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

const CTASection = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <section className="py-20 bg-background">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl gradient-primary p-8 md:p-16">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-white blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white blur-[120px]" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-primary-foreground mb-6">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">{t("home.ctaBadge")}</span>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
              {t("home.startJourney")}
            </h2>
            <p className="text-primary-foreground/80 text-lg md:text-xl max-w-2xl mx-auto mb-8">
              {t("home.ctaDescription")}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button 
                  size="xl" 
                  className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 shadow-lg hover:shadow-xl transition-all"
                >
                  {t("home.createFreeAccount")}
                  <Arrow className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button 
                  variant="outline" 
                  size="xl" 
                  className="w-full sm:w-auto border-white/30 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
                >
                  {t("home.contactUs")}
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-10 pt-8 border-t border-white/20">
              <p className="text-primary-foreground/60 text-sm mb-4">{t("home.trustedBy")}</p>
              <div className="flex items-center justify-center gap-8 flex-wrap">
                <div className="text-primary-foreground/80 text-sm">
                  <span className="font-bold text-lg">+500</span> {t("home.restaurants")}
                </div>
                <div className="hidden sm:block w-px h-6 bg-white/30" />
                <div className="text-primary-foreground/80 text-sm">
                  <span className="font-bold text-lg">+200</span> {t("home.suppliersCount")}
                </div>
                <div className="hidden sm:block w-px h-6 bg-white/30" />
                <div className="text-primary-foreground/80 text-sm">
                  <span className="font-bold text-lg">+10K</span> {t("home.ordersMonthly")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
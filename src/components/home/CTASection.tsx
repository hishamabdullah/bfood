import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl gradient-primary p-8 md:p-16 text-center">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-white blur-3xl" />
          </div>

          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
              ابدأ رحلتك مع BFOOD اليوم
            </h2>
            <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto mb-8">
              انضم لآلاف المطاعم والموردين الذين يثقون بمنصتنا لتسهيل أعمالهم
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button 
                  size="xl" 
                  className="w-full sm:w-auto bg-white text-primary hover:bg-white/90"
                >
                  أنشئ حسابك مجاناً
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button 
                  variant="outline" 
                  size="xl" 
                  className="w-full sm:w-auto border-white/30 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
                >
                  تواصل معنا
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;

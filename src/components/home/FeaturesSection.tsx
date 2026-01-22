import { ShoppingCart, Truck, Shield, Clock, CreditCard, Headphones } from "lucide-react";

const features = [
  {
    icon: ShoppingCart,
    title: "سلة موحدة",
    description: "اطلب من موردين متعددين في سلة واحدة وأكمل الدفع مرة واحدة"
  },
  {
    icon: Truck,
    title: "توصيل سريع",
    description: "شبكة توصيل واسعة تضمن وصول طلباتك في الوقت المحدد"
  },
  {
    icon: Shield,
    title: "جودة مضمونة",
    description: "موردين معتمدين ومنتجات عالية الجودة مع ضمان الإرجاع"
  },
  {
    icon: Clock,
    title: "متابعة الطلب",
    description: "تتبع حالة طلبك لحظة بلحظة من الطلب حتى التوصيل"
  },
  {
    icon: CreditCard,
    title: "دفع آمن",
    description: "طرق دفع متعددة وآمنة مع فواتير إلكترونية واضحة"
  },
  {
    icon: Headphones,
    title: "دعم متواصل",
    description: "فريق دعم متخصص متاح على مدار الساعة لمساعدتك"
  }
];

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            لماذا <span className="text-gradient-primary">BFOOD</span>؟
          </h2>
          <p className="text-muted-foreground text-lg">
            نقدم لك تجربة تسوق سهلة وموثوقة مع مميزات حصرية
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-card transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

import { UserPlus, Search, ShoppingBag, Truck } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    number: "01",
    title: "أنشئ حسابك",
    description: "سجّل كمطعم أو مورد في دقائق معدودة"
  },
  {
    icon: Search,
    number: "02",
    title: "تصفح المنتجات",
    description: "استعرض آلاف المنتجات من موردين متعددين"
  },
  {
    icon: ShoppingBag,
    number: "03",
    title: "أضف للسلة",
    description: "اختر منتجاتك وأضفها لسلة واحدة موحدة"
  },
  {
    icon: Truck,
    number: "04",
    title: "استلم طلبك",
    description: "تابع طلبك واستلمه في الوقت المحدد"
  }
];

const HowItWorksSection = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            كيف تعمل <span className="text-gradient-primary">المنصة</span>؟
          </h2>
          <p className="text-muted-foreground text-lg">
            أربع خطوات بسيطة للحصول على منتجاتك
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
              
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;

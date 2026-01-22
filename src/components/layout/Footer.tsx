import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
                <span className="text-xl font-bold text-primary-foreground">B</span>
              </div>
              <span className="text-xl font-bold text-foreground">BFOOD</span>
            </Link>
            <p className="text-muted-foreground max-w-md">
              منصة BFOOD تربط المطاعم بأفضل الموردين للمنتجات الغذائية. 
              نسهّل عملية الطلب ونضمن جودة المنتجات وسرعة التوصيل.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">روابط سريعة</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/products" className="text-muted-foreground hover:text-foreground transition-colors">
                  المنتجات
                </Link>
              </li>
              <li>
                <Link to="/suppliers" className="text-muted-foreground hover:text-foreground transition-colors">
                  الموردين
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  من نحن
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">الدعم</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  تواصل معنا
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-muted-foreground hover:text-foreground transition-colors">
                  الأسئلة الشائعة
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  الشروط والأحكام
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
          <p>© 2024 BFOOD. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container py-12 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">شروط الاستخدام</h1>

          <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4">القبول بالشروط</h2>
              <p className="text-muted-foreground leading-relaxed">
                باستخدامك لمنصة BFOOD، فإنك توافق على الالتزام بهذه الشروط
                والأحكام. إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم
                استخدام المنصة.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">وصف الخدمة</h2>
              <p className="text-muted-foreground leading-relaxed">
                BFOOD هي منصة تربط بين المطاعم والموردين للمنتجات الغذائية.
                نوفر أدوات لتسهيل عمليات الطلب والتوصيل والتواصل بين الطرفين.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">التسجيل والحساب</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>يجب تقديم معلومات دقيقة وكاملة عند التسجيل</li>
                <li>أنت مسؤول عن الحفاظ على سرية معلومات حسابك</li>
                <li>يجب إبلاغنا فوراً عن أي استخدام غير مصرح به لحسابك</li>
                <li>يجب أن يكون عمرك 18 عاماً أو أكثر للتسجيل</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">التزامات المطاعم</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>الالتزام بدفع المستحقات للموردين في الوقت المحدد</li>
                <li>تقديم معلومات دقيقة عن موقع التوصيل</li>
                <li>التعامل باحترافية مع الموردين</li>
                <li>الإبلاغ عن أي مشاكل في الطلبات بشكل فوري</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">التزامات الموردين</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>تقديم منتجات بجودة عالية ومطابقة للوصف</li>
                <li>الالتزام بمواعيد التوصيل المتفق عليها</li>
                <li>تحديث معلومات المنتجات والأسعار بشكل دوري</li>
                <li>الامتثال لجميع اللوائح الصحية والغذائية</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">الطلبات والدفع</h2>
              <p className="text-muted-foreground leading-relaxed">
                يتم الدفع بين المطاعم والموردين بشكل مباشر عند الاستلام. المنصة
                لا تتحمل مسؤولية أي خلافات مالية بين الطرفين.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">إخلاء المسؤولية</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>المنصة وسيط فقط ولا تتحمل مسؤولية جودة المنتجات</li>
                <li>لا نضمن توفر جميع المنتجات في جميع الأوقات</li>
                <li>نحتفظ بحق تعليق أو إنهاء أي حساب يخالف الشروط</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">حقوق الملكية الفكرية</h2>
              <p className="text-muted-foreground leading-relaxed">
                جميع محتويات المنصة بما في ذلك الشعارات والتصاميم والنصوص هي ملك
                لـ BFOOD. لا يجوز نسخها أو استخدامها دون إذن كتابي مسبق.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">التعديلات على الشروط</h2>
              <p className="text-muted-foreground leading-relaxed">
                نحتفظ بحق تعديل هذه الشروط في أي وقت. سيتم إشعارك بأي تغييرات
                جوهرية. استمرارك في استخدام المنصة يعني قبولك للشروط المحدثة.
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                آخر تحديث: يناير 2026
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;

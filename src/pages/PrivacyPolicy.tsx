import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container py-12 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">سياسة الخصوصية</h1>

          <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4">مقدمة</h2>
              <p className="text-muted-foreground leading-relaxed">
                نحن في BFOOD نلتزم بحماية خصوصية مستخدمينا. توضح سياسة الخصوصية
                هذه كيفية جمع واستخدام وحماية المعلومات الشخصية التي تقدمها عند
                استخدام منصتنا.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">المعلومات التي نجمعها</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>معلومات الحساب: الاسم، البريد الإلكتروني، رقم الهاتف</li>
                <li>معلومات النشاط التجاري: اسم المطعم أو الشركة، العنوان</li>
                <li>معلومات الطلبات: تفاصيل الطلبات والمعاملات</li>
                <li>معلومات الموقع: المنطقة الجغرافية لتسهيل التوصيل</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">كيف نستخدم معلوماتك</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>تسهيل عمليات الطلب والتوصيل بين المطاعم والموردين</li>
                <li>التواصل معك بشأن طلباتك وحسابك</li>
                <li>تحسين خدماتنا وتجربة المستخدم</li>
                <li>ضمان أمان وسلامة المنصة</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">مشاركة المعلومات</h2>
              <p className="text-muted-foreground leading-relaxed">
                نشارك معلومات الاتصال الضرورية بين المطاعم والموردين لإتمام
                الطلبات. لا نبيع أو نؤجر معلوماتك الشخصية لأطراف ثالثة لأغراض
                تسويقية.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">حماية البيانات</h2>
              <p className="text-muted-foreground leading-relaxed">
                نستخدم تقنيات أمان متقدمة لحماية بياناتك، بما في ذلك التشفير
                وإجراءات الأمان المعيارية في الصناعة.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">حقوقك</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>الوصول إلى بياناتك الشخصية</li>
                <li>تصحيح البيانات غير الدقيقة</li>
                <li>طلب حذف حسابك وبياناتك</li>
                <li>الاعتراض على معالجة بياناتك</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">التواصل معنا</h2>
              <p className="text-muted-foreground leading-relaxed">
                إذا كانت لديك أي أسئلة حول سياسة الخصوصية، يرجى التواصل معنا عبر
                البريد الإلكتروني أو من خلال نموذج الاتصال في الموقع.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">تحديث السياسة</h2>
              <p className="text-muted-foreground leading-relaxed">
                قد نقوم بتحديث سياسة الخصوصية من وقت لآخر. سنقوم بإعلامك بأي
                تغييرات جوهرية عبر البريد الإلكتروني أو إشعار على المنصة.
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

export default PrivacyPolicy;

import Link from "next/link";
import { ArrowLeft, Mail, ShieldCheck, Zap, Globe, ChevronRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-blue-500/30 font-sans selection:text-blue-200" dir="rtl">
      
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/20">
              SN
            </div>
            <span className="font-bold text-xl tracking-tight">سفانة نجد</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
            <a href="#features" className="hover:text-white transition-colors">المميزات</a>
            <a href="#about" className="hover:text-white transition-colors">من نحن</a>
            <a href="#contact" className="hover:text-white transition-colors">تواصل معنا</a>
          </div>
          <Link href="/dashboard" className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 border border-white/5">
            لوحة البريد
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              نظام البريد وإدارة الأعمال متاح الآن
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.15] tracking-tight mb-8">
              مؤسسة <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">سفانة نجد</span>
              <br /> للتجارة المحلية والدولية
            </h1>
            
            <p className="text-lg md:text-xl text-neutral-400 leading-relaxed mb-10 max-w-2xl">
              نحن متخصصون في استيراد وتصدير المواد الخام (Raw Materials)، وعلى رأسها منتجات البلاستيك، ونعمل كحلقة وصل موثوقة مع كبرى المصانع وشركات الشحن حول العالم.
            </p>
            
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-medium transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2 group">
                تسجيل الدخول للنظام
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </Link>
              <a href="#contact" className="bg-neutral-800 hover:bg-neutral-700 text-white px-8 py-4 rounded-full font-medium transition-all border border-neutral-700">
                تواصل معنا
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-neutral-900/50 border-y border-neutral-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">خدمات متكاملة وآمنة</h2>
            <p className="text-neutral-400">نظامنا مصمم لتلبية احتياجات الشركات بمرونة عالية وأمان لا يضاهى.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 hover:border-neutral-700 transition-colors">
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">حماية متقدمة</h3>
              <p className="text-neutral-400 leading-relaxed">
                نظام فلترة ذكي للرسائل المزعجة (Spam) ومكافحة الفيروسات لضمان بيئة عمل آمنة.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 hover:border-neutral-700 transition-colors">
              <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">سرعة فائقة</h3>
              <p className="text-neutral-400 leading-relaxed">
                استقبال وإرسال فوري للرسائل مع تقنيات معالجة البيانات اللحظية والواجهات الحديثة.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 hover:border-neutral-700 transition-colors">
              <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6">
                <Globe className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">وصول عالمي</h3>
              <p className="text-neutral-400 leading-relaxed">
                لوحة تحكم سحابية بالكامل، تتيح لك إدارة أعمالك من أي مكان وفي أي وقت.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-neutral-950 border-t border-neutral-900 text-center text-neutral-500 text-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} مؤسسة سفانة نجد. جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">الشروط والأحكام</a>
            <a href="#" className="hover:text-white transition-colors">سياسة الخصوصية</a>
          </div>
        </div>
      </footer>

    </div>
  );
}

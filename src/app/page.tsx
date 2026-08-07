'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Globe, Moon, Sun, ArrowRight, ArrowLeft } from 'lucide-react';

export default function LandingPage() {
  const { lang, setLang, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/landing')
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error(err));
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { services, partners, settings } = data;

  const toggleLang = () => {
    setLang(lang === 'ar' ? 'en' : 'ar');
  };

  const isRtl = lang === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass w-full transition-colors duration-300">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-8 h-8 text-gold" />
            <span className="font-bold text-xl md:text-2xl">
              {lang === 'ar' ? 'سفانة نجد' : 'Safana Najd'}
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#home" className="hover:text-gold transition-colors">{t({ ar: 'الرئيسية', en: 'Home' })}</a>
            {services?.length > 0 && (
              <a href="#services" className="hover:text-gold transition-colors">{t({ ar: 'خدماتنا', en: 'Services' })}</a>
            )}
            <a href="#about" className="hover:text-gold transition-colors">{t({ ar: 'من نحن', en: 'About Us' })}</a>
            <a href="#contact" className="hover:text-gold transition-colors">{t({ ar: 'تواصل معنا', en: 'Contact' })}</a>
          </nav>

          <div className="flex items-center gap-4">
            <button onClick={toggleLang} className="font-semibold text-sm hover:text-gold transition-colors">
              {lang === 'ar' ? 'EN' : 'عربي'}
            </button>
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <Link href="/login" className="px-4 py-2 bg-gold text-white rounded-lg font-medium hover:bg-gold-light transition-colors">
              {t({ ar: 'تسجيل الدخول', en: 'Login' })}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section id="home" className="relative h-[90vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image src="/images/hero.jpg" alt="Hero" fill className="object-cover" priority />
            <div className={`absolute inset-0 ${theme === 'light' ? 'bg-white/70' : 'bg-primary/80'}`}></div>
          </div>
          
          <div className="container mx-auto px-4 z-10 relative">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              className="max-w-3xl text-center mx-auto"
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gradient leading-tight">
                {lang === 'ar' ? settings.heroTitleAr : settings.heroTitleEn}
              </h1>
              <p className="text-lg md:text-xl mb-10 opacity-90 leading-relaxed">
                {lang === 'ar' ? settings.heroDescAr : settings.heroDescEn}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="#contact" className="w-full sm:w-auto px-8 py-4 bg-gold text-white rounded-lg font-bold hover:bg-gold-light transition-all flex items-center justify-center gap-2">
                  {t({ ar: 'تواصل معنا', en: 'Contact Us' })}
                  <ArrowIcon className="w-5 h-5" />
                </a>
                <a href="#about" className="w-full sm:w-auto px-8 py-4 glass-card rounded-lg font-bold hover:bg-black/5 dark:hover:bg-white/10 transition-all text-center">
                  {t({ ar: 'اعرف المزيد', en: 'Learn More' })}
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Services Section */}
        {services && services.length > 0 && (
          <section id="services" className="py-24 bg-gray-50 dark:bg-secondary/20">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                className="text-center mb-16"
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-4">{t({ ar: 'خدماتنا', en: 'Our Services' })}</h2>
                <div className="w-20 h-1 bg-gold mx-auto rounded-full"></div>
              </motion.div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {services.map((service: any, index: number) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1, ease: [0.4, 0, 0.2, 1] }}
                    className="glass-card p-8 rounded-2xl hover:-translate-y-2 transition-transform duration-300"
                  >
                    <div className="w-14 h-14 bg-gold/10 rounded-xl flex items-center justify-center mb-6">
                      <Globe className="w-7 h-7 text-gold" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{lang === 'ar' ? service.titleAr : service.titleEn}</h3>
                    <p className="opacity-80 leading-relaxed">{lang === 'ar' ? service.descAr : service.descEn}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* About Section */}
        <section id="about" className="py-24">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <motion.div 
                initial={{ opacity: 0, x: isRtl ? 50 : -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                className="lg:w-1/2 relative h-[500px] w-full rounded-2xl overflow-hidden"
              >
                <Image src="/images/about.jpg" alt="About Us" fill className="object-cover" />
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: isRtl ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                className="lg:w-1/2"
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-4">{lang === 'ar' ? settings.aboutTitleAr : settings.aboutTitleEn}</h2>
                <div className="w-20 h-1 bg-gold mb-8 rounded-full"></div>
                <p className="text-lg opacity-90 leading-relaxed mb-10">
                  {lang === 'ar' ? settings.aboutDescAr : settings.aboutDescEn}
                </p>
                
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center p-4 glass-card rounded-xl">
                    <div className="text-3xl font-bold text-gold mb-2">{settings.statsClients}</div>
                    <div className="text-sm font-medium">{t({ ar: 'عميل سعيد', en: 'Happy Clients' })}</div>
                  </div>
                  <div className="text-center p-4 glass-card rounded-xl">
                    <div className="text-3xl font-bold text-gold mb-2">{settings.statsYears}</div>
                    <div className="text-sm font-medium">{t({ ar: 'سنوات خبرة', en: 'Years Experience' })}</div>
                  </div>
                  <div className="text-center p-4 glass-card rounded-xl">
                    <div className="text-3xl font-bold text-gold mb-2">{settings.statsCountries}</div>
                    <div className="text-sm font-medium">{t({ ar: 'دولة', en: 'Countries' })}</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Partners Section */}
        {partners && partners.length > 0 && (
          <section className="py-16 bg-gray-50 dark:bg-secondary/20 overflow-hidden">
            <div className="container mx-auto px-4 mb-10 text-center">
              <h2 className="text-2xl md:text-3xl font-bold">{t({ ar: 'شركاء النجاح', en: 'Our Partners' })}</h2>
            </div>
            <div className="flex gap-8 px-4 w-max animate-[marquee_20s_linear_infinite] hover:animate-[marquee_20s_linear_infinite_paused]">
              {[...partners, ...partners, ...partners].map((partner: any, i: number) => (
                <div key={i} className="flex items-center justify-center w-48 h-24 glass-card rounded-xl p-4 grayscale hover:grayscale-0 transition-all">
                  {partner.logoUrl ? (
                    <img src={partner.logoUrl} alt={partner.name} className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="font-bold text-lg">{partner.name}</span>
                  )}
                </div>
              ))}
            </div>
            <style jsx>{`
              @keyframes marquee {
                0% { transform: translateX(0); }
                100% { transform: translateX(-33.33%); }
              }
            `}</style>
          </section>
        )}

        {/* Contact Section */}
        <section id="contact" className="py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t({ ar: 'تواصل معنا', en: 'Contact Us' })}</h2>
              <div className="w-20 h-1 bg-gold mx-auto rounded-full"></div>
            </motion.div>
            
            <div className="max-w-4xl mx-auto glass-card rounded-3xl p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-12">
                <div>
                  <h3 className="text-2xl font-bold mb-6">{t({ ar: 'دعنا نتحدث', en: 'Let\'s Talk' })}</h3>
                  <p className="opacity-80 mb-8 leading-relaxed">
                    {t({ ar: 'نحن هنا للإجابة على جميع استفساراتك وتقديم أفضل الحلول لأعمالك.', en: 'We are here to answer all your inquiries and provide the best solutions for your business.' })}
                  </p>
                  
                  <div className="space-y-6">
                    <div>
                      <div className="text-sm opacity-60 mb-1">{t({ ar: 'البريد الإلكتروني', en: 'Email' })}</div>
                      <div className="font-medium text-lg">{settings.contactEmail}</div>
                    </div>
                    <div>
                      <div className="text-sm opacity-60 mb-1">{t({ ar: 'رقم الهاتف', en: 'Phone' })}</div>
                      <div className="font-medium text-lg">{settings.contactPhone}</div>
                    </div>
                    <div>
                      <div className="text-sm opacity-60 mb-1">{t({ ar: 'العنوان', en: 'Address' })}</div>
                      <div className="font-medium text-lg">{settings.contactAddress}</div>
                    </div>
                  </div>
                </div>
                
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div>
                    <input type="text" placeholder={t({ ar: 'الاسم', en: 'Name' })} className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-transparent focus:border-gold outline-none transition-colors" />
                  </div>
                  <div>
                    <input type="email" placeholder={t({ ar: 'البريد الإلكتروني', en: 'Email' })} className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-transparent focus:border-gold outline-none transition-colors" />
                  </div>
                  <div>
                    <textarea rows={4} placeholder={t({ ar: 'الرسالة', en: 'Message' })} className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-transparent focus:border-gold outline-none transition-colors resize-none"></textarea>
                  </div>
                  <button className="w-full py-4 bg-gold text-white rounded-xl font-bold hover:bg-gold-light transition-colors">
                    {t({ ar: 'إرسال الرسالة', en: 'Send Message' })}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-primary text-white py-12 border-t border-white/10">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Globe className="w-6 h-6 text-gold" />
            <span className="font-bold text-xl">
              {lang === 'ar' ? 'سفانة نجد' : 'Safana Najd'}
            </span>
          </div>
          <p className="opacity-70 mb-8 max-w-md mx-auto">
            {t({ 
              ar: 'شريكك الموثوق في استيراد وتصدير المواد الخام.', 
              en: 'Your trusted partner in importing and exporting raw materials.' 
            })}
          </p>
          <div className="opacity-50 text-sm">
            © {new Date().getFullYear()} {lang === 'ar' ? 'سفانة نجد للتجارة. جميع الحقوق محفوظة.' : 'Safana Najd Trading. All rights reserved.'}
          </div>
        </div>
      </footer>
    </div>
  );
}

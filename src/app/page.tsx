"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Globe, Anchor, ShieldCheck, TrendingUp, Mail, Phone, MapPin, Menu, X, LogIn } from "lucide-react";
import Link from "next/link";

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7 } }
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { ar: "الرئيسية", en: "Home", href: "#" },
    { ar: "خدماتنا", en: "Services", href: "#services" },
    { ar: "من نحن", en: "About", href: "#about" },
    { ar: "تواصل معنا", en: "Contact", href: "#contact" },
  ];

  const services = [
    {
      icon: <Globe className="w-8 h-8 text-gold" />,
      titleAr: "استيراد وتصدير المواد الخام",
      titleEn: "Raw Materials Import & Export",
      descAr: "نربط المصانع المحلية بالأسواق العالمية من خلال توريد أجود المواد الخام.",
      descEn: "Connecting local factories with global markets by supplying premium raw materials."
    },
    {
      icon: <Anchor className="w-8 h-8 text-gold" />,
      titleAr: "توريد البلاستيك للمصانع",
      titleEn: "Plastic Supply for Factories",
      descAr: "توفير حلول شاملة لتوريد كافة أنواع المواد البلاستيكية للمصانع.",
      descEn: "Providing comprehensive solutions for supplying all types of plastic materials."
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-gold" />,
      titleAr: "الشحن والتخليص الجمركي",
      titleEn: "Shipping & Customs Clearance",
      descAr: "خدمات لوجستية متكاملة تضمن وصول بضائعك بأمان وسرعة.",
      descEn: "Integrated logistics services ensuring your goods arrive safely and quickly."
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-gold" />,
      titleAr: "استشارات تجارية",
      titleEn: "Trade Consulting",
      descAr: "استشارات متخصصة في الأسواق العالمية وفرص التوسع التجاري.",
      descEn: "Specialized consulting in global markets and business expansion opportunities."
    }
  ];

  return (
    <div className="min-h-screen bg-primary overflow-x-hidden">
      {/* Background Animated Blobs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-gold/10 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[150px] animate-pulse" style={{ animationDelay: "2s" }}></div>
      </div>

      {/* Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? "glass py-3" : "py-5 bg-transparent"}`}>
        <div className="container mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="#" className="flex flex-col items-start group">
            <h1 className="text-2xl font-bold text-gradient tracking-tight">سفانة نجد</h1>
            <span className="text-xs text-slate-400 font-medium group-hover:text-gold transition-colors duration-300 uppercase tracking-widest mt-1">Safana Najd</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-10">
            {navLinks.map((link, index) => (
              <Link key={index} href={link.href} className="flex flex-col items-center group">
                <span className="text-sm font-semibold text-slate-200 group-hover:text-gold transition-colors">{link.ar}</span>
                <span className="text-[10px] text-slate-500 group-hover:text-gold/70 transition-colors">{link.en}</span>
              </Link>
            ))}
          </nav>

          {/* Login Button Desktop */}
          <div className="hidden md:block">
            <Link href="/login" className="flex items-center gap-2 bg-white/5 hover:bg-gold/20 border border-gold/30 hover:border-gold text-gold transition-all duration-300 px-5 py-2.5 rounded-full">
              <LogIn className="w-4 h-4" />
              <div className="flex flex-col items-start leading-none">
                <span className="text-sm font-bold">تسجيل الدخول</span>
              </div>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-slate-200" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full glass-card border-t-0 p-6 flex flex-col gap-6">
            {navLinks.map((link, index) => (
              <Link key={index} href={link.href} className="flex items-center justify-between border-b border-white/5 pb-2" onClick={() => setMobileMenuOpen(false)}>
                <span className="text-lg font-bold text-slate-200">{link.ar}</span>
                <span className="text-sm text-slate-500">{link.en}</span>
              </Link>
            ))}
            <Link href="/login" className="flex items-center justify-center gap-2 bg-gold/10 border border-gold text-gold p-3 rounded-xl mt-4" onClick={() => setMobileMenuOpen(false)}>
              <LogIn className="w-5 h-5" />
              <span className="font-bold">تسجيل الدخول | Login</span>
            </Link>
          </div>
        )}
      </header>

      <main className="relative z-10 pt-32 pb-20">
        {/* Hero Section */}
        <section className="container mx-auto px-6 min-h-[75vh] flex flex-col items-center justify-center text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-4xl mx-auto">
            <motion.div variants={fadeInUp} className="inline-block mb-6 px-4 py-1.5 rounded-full glass border-gold/30 text-gold text-sm font-medium">
              الخيار الأول للتجارة الدولية | First Choice for International Trade
            </motion.div>
            
            <motion.h2 variants={fadeInUp} className="text-5xl md:text-7xl font-extrabold text-white mb-4 leading-tight">
              نربط <span className="text-gradient">العالم</span> بصناعتك
            </motion.h2>
            <motion.h3 variants={fadeInUp} className="text-2xl md:text-4xl text-slate-300 font-light mb-8">
              Connecting the <span className="text-gold-light">World</span> to Your Industry
            </motion.h3>
            
            <motion.p variants={fadeInUp} className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              سفانة نجد للتجارة، شريكك الموثوق في استيراد وتصدير المواد الخام وتوريد البلاستيك بأعلى معايير الجودة العالمية.
              <br />
              <span className="text-sm text-slate-500 mt-2 block">
                Safana Najd Trading, your trusted partner in importing and exporting raw materials and supplying plastics with the highest global quality standards.
              </span>
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="#contact" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-gold to-gold-light text-primary font-bold rounded-full hover:shadow-[0_0_20px_rgba(212,168,83,0.4)] transition-all duration-300 transform hover:-translate-y-1">
                تواصل معنا | Contact Us
              </Link>
              <Link href="#about" className="w-full sm:w-auto px-8 py-4 glass text-white font-bold rounded-full hover:bg-white/10 transition-all duration-300">
                اعرف المزيد | Learn More
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* Services Section */}
        <section id="services" className="container mx-auto px-6 py-24">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-2">خدماتنا</h2>
            <h3 className="text-xl text-gold uppercase tracking-widest">Our Services</h3>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, idx) => (
              <motion.div 
                key={idx}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: idx * 0.1 } }
                }}
                className="glass-card p-8 rounded-3xl hover:-translate-y-2 transition-transform duration-300 group"
              >
                <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  {service.icon}
                </div>
                <h4 className="text-xl font-bold text-white mb-1">{service.titleAr}</h4>
                <h5 className="text-sm text-gold mb-4">{service.titleEn}</h5>
                <p className="text-slate-300 text-sm mb-3 leading-relaxed">{service.descAr}</p>
                <p className="text-slate-500 text-xs leading-relaxed">{service.descEn}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-24 bg-secondary/30 relative">
          <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <motion.div 
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
                className="lg:w-1/2"
              >
                <h2 className="text-4xl font-bold text-white mb-2">من نحن</h2>
                <h3 className="text-xl text-gold uppercase tracking-widest mb-8">About Us</h3>
                
                <p className="text-lg text-slate-300 mb-6 leading-relaxed">
                  نحن في سفانة نجد للتجارة نعتز بخبرتنا العميقة في مجال التجارة الدولية. تخصصنا الأساسي هو توفير أفضل المواد الخام اللازمة للصناعات المختلفة، مع التركيز بشكل خاص على قطاع البلاستيك.
                </p>
                <p className="text-sm text-slate-400 mb-10 leading-relaxed">
                  At Safana Najd Trading, we pride ourselves on our deep expertise in international trade. Our core specialty is providing the best raw materials for various industries, with a special focus on the plastics sector.
                </p>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { num: "+50", ar: "عميل", en: "Clients" },
                    { num: "+15", ar: "سنة خبرة", en: "Years Exp" },
                    { num: "+10", ar: "دول", en: "Countries" },
                  ].map((stat, idx) => (
                    <div key={idx} className="glass rounded-2xl p-4 text-center">
                      <div className="text-3xl font-extrabold text-gradient mb-1">{stat.num}</div>
                      <div className="text-sm font-bold text-white">{stat.ar}</div>
                      <div className="text-xs text-slate-400">{stat.en}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
                className="lg:w-1/2 w-full h-[500px] rounded-3xl glass-card overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gold/20 to-transparent z-10"></div>
                {/* Placeholder for an image */}
                <div className="absolute inset-0 flex items-center justify-center text-slate-600 bg-black/40">
                  <span className="text-xl font-light tracking-wider uppercase">Premium Trading Image Placeholder</span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Partners Marquee */}
        <section className="py-16 overflow-hidden border-y border-white/5 bg-[#07101f]">
          <div className="container mx-auto px-6 text-center mb-10">
            <h2 className="text-2xl font-bold text-white">شركاؤنا</h2>
            <h3 className="text-sm text-gold uppercase tracking-widest">Our Partners</h3>
          </div>
          <div className="flex w-[200%] animate-[marquee_20s_linear_infinite] hover:[animation-play-state:paused]">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex-none mx-4 w-48 h-20 glass rounded-xl flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity">
                <span className="text-slate-400 font-medium">Partner Logo</span>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="container mx-auto px-6 py-24">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-2">تواصل معنا</h2>
            <h3 className="text-xl text-gold uppercase tracking-widest">Contact Us</h3>
          </motion.div>

          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="lg:col-span-1 flex flex-col gap-6">
              <div className="glass-card p-6 rounded-2xl flex items-start gap-4">
                <div className="bg-gold/10 p-3 rounded-lg"><Mail className="w-6 h-6 text-gold" /></div>
                <div>
                  <h4 className="text-lg font-bold text-white">البريد الإلكتروني</h4>
                  <p className="text-sm text-slate-400">info@safananajd.com</p>
                </div>
              </div>
              <div className="glass-card p-6 rounded-2xl flex items-start gap-4">
                <div className="bg-gold/10 p-3 rounded-lg"><Phone className="w-6 h-6 text-gold" /></div>
                <div>
                  <h4 className="text-lg font-bold text-white">الهاتف</h4>
                  <p className="text-sm text-slate-400" dir="ltr">+966 50 000 0000</p>
                </div>
              </div>
              <div className="glass-card p-6 rounded-2xl flex items-start gap-4">
                <div className="bg-gold/10 p-3 rounded-lg"><MapPin className="w-6 h-6 text-gold" /></div>
                <div>
                  <h4 className="text-lg font-bold text-white">الموقع</h4>
                  <p className="text-sm text-slate-400">الرياض، المملكة العربية السعودية</p>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="lg:col-span-2 glass-card p-8 rounded-3xl">
              <form className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-300">الاسم | Name</label>
                    <input type="text" className="bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-gold transition-colors" placeholder="محمد أحمد | Mohammed Ahmed" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-300">البريد | Email</label>
                    <input type="email" className="bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-gold transition-colors" placeholder="email@example.com" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-300">الرسالة | Message</label>
                  <textarea rows={5} className="bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-gold transition-colors resize-none" placeholder="اكتب رسالتك هنا... | Type your message here..."></textarea>
                </div>
                <button type="button" className="w-full py-4 bg-gradient-to-r from-gold to-gold-light text-primary font-bold rounded-xl hover:shadow-[0_0_15px_rgba(212,168,83,0.3)] transition-all">
                  إرسال الرسالة | Send Message
                </button>
              </form>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#07101f] pt-16 pb-8">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
            <div>
              <Link href="#" className="inline-flex flex-col items-start mb-6 group">
                <h2 className="text-2xl font-bold text-gradient">سفانة نجد</h2>
                <span className="text-xs text-slate-400 font-medium group-hover:text-gold uppercase tracking-widest">Safana Najd</span>
              </Link>
              <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                شريكك الموثوق في عالم التجارة الدولية وتوريد المواد الخام.
                <br /><br />
                Your trusted partner in international trade and raw materials supply.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-bold text-white mb-6">روابط سريعة | Quick Links</h4>
              <ul className="flex flex-col gap-3">
                {navLinks.map((link, idx) => (
                  <li key={idx}>
                    <Link href={link.href} className="text-slate-400 hover:text-gold transition-colors inline-flex items-center gap-2">
                      <span>{link.ar}</span>
                      <span className="text-xs">| {link.en}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold text-white mb-6">تواصل | Connect</h4>
              <div className="flex gap-4">
                {/* Social Placeholders */}
                {[1, 2, 3].map((i) => (
                  <a key={i} href="#" className="w-10 h-10 rounded-full glass flex items-center justify-center text-slate-400 hover:text-gold hover:border-gold transition-all">
                    {i}
                  </a>
                ))}
              </div>
            </div>
          </div>
          
          <div className="text-center pt-8 border-t border-white/5 text-slate-500 text-sm">
            <p>© {new Date().getFullYear()} سفانة نجد للتجارة. جميع الحقوق محفوظة.</p>
            <p className="mt-1">© {new Date().getFullYear()} Safana Najd Trading. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(50%); }
        }
      `}</style>
    </div>
  );
}

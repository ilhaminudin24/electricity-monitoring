import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { fetchPublishedCMSContent, subscribeToCMSUpdates } from '../services/cmsService';
import LanguageSwitcher from '../components/LanguageSwitcher';
import {
  Zap,
  BarChart3,
  ArrowRight,
  Menu,
  X,
  Bell,
  TrendingUp,
  Calculator,
  Wallet,
  Globe,
  Cloud,
  Shield,
  CheckCircle,
  ChevronRight,
  Target
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LandingPage = React.memo(() => {
  const { t, i18n } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if authenticated
  useEffect(() => {
    if (currentUser && !loading) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, loading, navigate]);

  // CMS Data State
  const [cmsData, setCmsData] = useState({
    hero: null,
    bottomCTA: null,
    testimonial: null,
    features: null,
    howItWorks: null,
    screenshots: null,
    footer: null,
    loading: true
  });

  // Load CMS data
  useEffect(() => {
    let isMounted = true;
    let unsubscribe = null;

    const fetchInitialData = async () => {
      try {
        const mappedData = await fetchPublishedCMSContent({ bypassCache: false });
        if (isMounted) {
          setCmsData(prev => ({ ...prev, ...mappedData, loading: false }));
        }
      } catch (error) {
        if (isMounted) setCmsData(prev => ({ ...prev, loading: false }));
      }
    };

    const setupRealtime = () => {
      unsubscribe = subscribeToCMSUpdates((sectionId, content) => {
        if (isMounted) {
          setCmsData(prev => ({ ...prev, [sectionId]: content }));
        }
      });
    };

    fetchInitialData();
    setupRealtime();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const currentLang = i18n.language === 'id' ? 'id' : 'en';

  // CMS Helpers
  const getHeroData = useCallback(() => {
    if (cmsData.hero && typeof cmsData.hero === 'object') {
      const langData = cmsData.hero[currentLang] || cmsData.hero.en;
      if (langData?.title) return langData;
    }
    return null;
  }, [cmsData.hero, currentLang]);

  const heroData = getHeroData();

  // Animation Variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <div className="min-h-screen bg-background-light text-text-main font-body selection:bg-primary/20 selection:text-primary">

      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-[#f0f2f5] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-10">
          <div className="flex items-center justify-between h-[72px]">
            {/* Logo */}
            <div className="flex items-center cursor-pointer">
              <img src={`${import.meta.env.BASE_URL}logo.png`} alt="CatatToken.ID" className="h-8 object-contain" />
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex flex-1 justify-end items-center gap-8">
              <div className="hidden lg:flex items-center gap-8 mr-4">
                <a href="#features" className="text-text-main hover:text-primary transition-colors text-sm font-medium">Features</a>
                <a href="#pricing" className="text-text-main hover:text-primary transition-colors text-sm font-medium">Pricing</a>
                <a href="#docs" className="text-text-main hover:text-primary transition-colors text-sm font-medium">Docs</a>
              </div>
              <div className="flex gap-3 items-center">
                <LanguageSwitcher />
                <Link to="/login">
                  <button className="flex items-center justify-center rounded-full h-10 px-5 border border-primary/20 bg-transparent text-primary hover:bg-primary/5 transition-colors text-sm font-bold tracking-wide">
                    {t('btn_login')}
                  </button>
                </Link>
                <Link to="/register">
                  <button className="flex items-center justify-center rounded-full h-10 px-5 bg-primary hover:bg-blue-600 shadow-glow hover:shadow-lg transition-all text-white text-sm font-bold tracking-wide">
                    {t('cta_start')}
                  </button>
                </Link>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-4">
              <LanguageSwitcher />
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-text-main">
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-[#f0f2f5]"
          >
            <div className="px-4 py-4 flex flex-col gap-4">
              <a href="#features" className="text-text-main font-medium py-2">Features</a>
              <a href="#pricing" className="text-text-main font-medium py-2">Pricing</a>
              <Link to="/login" className="text-primary font-bold py-2">{t('btn_login')}</Link>
              <Link to="/register" className="bg-primary text-white text-center rounded-full py-3 font-bold shadow-lg">
                {t('cta_start')}
              </Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Main Content */}
      <main className="pt-[72px] overflow-hidden">

        {/* Hero Section */}
        <section className="relative bg-background-light py-12 lg:py-24 px-4 md:px-10">
          {/* Background Decorative Blurs */}
          <div className="absolute top-0 right-0 -z-10 h-[600px] w-[600px] translate-x-1/3 -translate-y-1/4 rounded-full bg-secondary/10 blur-[100px]" />
          <div className="absolute bottom-0 left-0 -z-10 h-[400px] w-[400px] -translate-x-1/3 translate-y-1/4 rounded-full bg-primary/10 blur-[80px]" />

          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-20">

              {/* Text Content */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="flex flex-col gap-8 flex-1 text-center lg:text-left"
              >
                <div className="flex flex-col gap-4">
                  <motion.div variants={fadeInUp} className="inline-flex self-center lg:self-start items-center gap-2 rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-secondary">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
                    </span>
                    {t('landingPage.hero.badge', 'Token Listrik Prabayar')}
                  </motion.div>

                  <motion.h1 variants={fadeInUp} className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight text-text-main">
                    {heroData?.title || t('landingPage.hero.title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">{t('landingPage.hero.highlight', 'Cerdas & Akurat')}</span>
                  </motion.h1>

                  <motion.p variants={fadeInUp} className="text-text-sub text-lg sm:text-xl font-normal leading-relaxed max-w-2xl mx-auto lg:mx-0">
                    {heroData?.subtitle || t('landingPage.hero.subtitle')}
                  </motion.p>
                </div>

                <motion.div variants={fadeInUp} className="flex flex-wrap gap-4 justify-center lg:justify-start">
                  <Link to="/register">
                    <button className="flex min-w-[160px] cursor-pointer items-center justify-center rounded-full h-12 px-8 bg-primary hover:bg-blue-600 shadow-glow hover:shadow-lg hover:-translate-y-0.5 transition-all text-white text-base font-bold tracking-wide">
                      {t('landingPage.hero.ctaStart')}
                    </button>
                  </Link>
                  <Link to="/login">
                    <button className="group flex min-w-[140px] cursor-pointer items-center justify-center gap-2 rounded-full h-12 px-6 bg-white text-text-main hover:text-primary transition-colors text-base font-bold tracking-wide border border-gray-100 shadow-sm">
                      {t('landingPage.hero.ctaLogin')}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                </motion.div>

                <motion.div variants={fadeInUp} className="flex items-center justify-center lg:justify-start gap-4 pt-4 text-sm text-text-sub">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`h-8 w-8 rounded-full border-2 border-white bg-gray-${i + 1}00`} />
                    ))}
                  </div>
                  <p>{t('landingPage.hero.socialProof', 'Dipercaya pengguna listrik prabayar Indonesia')}</p>
                </motion.div>
              </motion.div>

              {/* Hero Image / Mockup */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="w-full lg:w-1/2 flex justify-center lg:justify-end relative"
              >
                <div className="relative w-full aspect-square max-w-[600px]">
                  {/* Abstract Glow */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-full blur-3xl -z-10" />

                  {/* Main Image */}
                  <div
                    className="w-full h-full bg-contain bg-center bg-no-repeat drop-shadow-2xl animate-float"
                    style={{
                      backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD95I77DitiZzYGbF5EUwfKqAPvr8BjxvdxX1s6VDuMIjONW8T5MTFlCeuX3Vb-zbbiWFx-pxw0KSNACR7QBg4cCoFZpk9owWIOxiTbYimV1Egj84-MKP_881lWUcac2slD7tgeoq-EleasSba-vfD-zsth3ZQlSfS1VvXQsGCMTKfImgoOE9i6APDFUQMDc9DHNI_dK_qJgrTP6YgQM74tgJDOpiUQBEzIBVlRdUVMEiO7KlIPUwPYuo0Rx6fs2F9g0nl7zS59dr4")',
                      borderRadius: '24px'
                    }}
                  />

                  {/* Floating Cards (Decorations) */}
                  <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-soft border border-gray-100 flex items-center gap-3 animate-float-delayed">
                    <div className="bg-amber-100 p-2 rounded-full text-amber-600">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-text-sub font-medium">{t('landingPage.floatingCards.tokenBalance', 'Sisa Token')}</p>
                      <p className="text-sm font-bold text-text-main">45.8 kWh</p>
                    </div>
                  </div>

                  <div className="absolute top-10 -right-4 bg-white p-4 rounded-xl shadow-soft border border-gray-100 flex items-center gap-3 animate-float">
                    <div className="bg-secondary/20 p-2 rounded-full text-secondary">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-text-sub font-medium">{t('landingPage.floatingCards.dailyUsage', 'Pemakaian Hari Ini')}</p>
                      <p className="text-sm font-bold text-text-main">3.2 kWh</p>
                    </div>
                  </div>

                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Trust Badges Section */}
        <section className="border-y border-[#f0f2f5] bg-white py-8">
          <div className="max-w-7xl mx-auto px-4 md:px-10">
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
              <div className="flex items-center gap-2 text-text-sub">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">{t('landingPage.trust.secure', 'Data Aman Terenkripsi')}</span>
              </div>
              <div className="flex items-center gap-2 text-text-sub">
                <Cloud className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">{t('landingPage.trust.cloud', 'Cloud Sync')}</span>
              </div>
              <div className="flex items-center gap-2 text-text-sub">
                <Globe className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">{t('landingPage.trust.language', 'Bahasa Indonesia & English')}</span>
              </div>
              <div className="flex items-center gap-2 text-text-sub">
                <Zap className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">{t('landingPage.trust.pln', 'Tarif PLN Resmi')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 lg:py-32 bg-white relative">
          <div className="max-w-7xl mx-auto px-4 md:px-10 lg:px-20">
            <div className="flex flex-col gap-16">

              {/* Section Header */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="text-center max-w-3xl mx-auto flex flex-col gap-4"
              >
                <h2 className="text-primary font-bold tracking-wider uppercase text-sm">{t('landingPage.features.title')}</h2>
                <h3 className="text-text-main text-3xl md:text-4xl font-black leading-tight tracking-tight">
                  {t('landingPage.features.subtitle')}
                </h3>
                <p className="text-text-sub text-lg leading-relaxed">
                  {t('landingPage.features.description', 'CatatToken.ID memberikan semua yang Anda butuhkan untuk memahami pola konsumsi dan mengoptimalkan pengeluaran listrik.')}
                </p>
              </motion.div>

              {/* Feature Cards */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
                className="grid grid-cols-1 md:grid-cols-3 gap-8"
              >
                {[
                  {
                    icon: <BarChart3 className="w-8 h-8" />,
                    color: "text-primary",
                    bg: "bg-primary/10",
                    hoverBg: "group-hover:bg-primary",
                    titleKey: "landingPage.features.feature1Title",
                    descKey: "landingPage.features.feature1Desc"
                  },
                  {
                    icon: <Bell className="w-8 h-8" />,
                    color: "text-amber-500",
                    bg: "bg-amber-100",
                    hoverBg: "group-hover:bg-amber-500",
                    titleKey: "landingPage.features.feature2Title",
                    descKey: "landingPage.features.feature2Desc"
                  },
                  {
                    icon: <Calculator className="w-8 h-8" />,
                    color: "text-secondary",
                    bg: "bg-secondary/10",
                    hoverBg: "group-hover:bg-secondary",
                    titleKey: "landingPage.features.feature3Title",
                    descKey: "landingPage.features.feature3Desc"
                  },
                  {
                    icon: <Wallet className="w-8 h-8" />,
                    color: "text-purple-600",
                    bg: "bg-purple-100",
                    hoverBg: "group-hover:bg-purple-600",
                    titleKey: "landingPage.features.feature4Title",
                    descKey: "landingPage.features.feature4Desc"
                  },
                  {
                    icon: <Target className="w-8 h-8" />,
                    color: "text-rose-500",
                    bg: "bg-rose-100",
                    hoverBg: "group-hover:bg-rose-500",
                    titleKey: "landingPage.features.feature5Title",
                    descKey: "landingPage.features.feature5Desc"
                  },
                  {
                    icon: <Cloud className="w-8 h-8" />,
                    color: "text-cyan-500",
                    bg: "bg-cyan-100",
                    hoverBg: "group-hover:bg-cyan-500",
                    titleKey: "landingPage.features.feature6Title",
                    descKey: "landingPage.features.feature6Desc"
                  }
                ].map((feature, idx) => (
                  <motion.div
                    key={idx}
                    variants={fadeInUp}
                    className="group flex flex-col gap-6 rounded-2xl border border-gray-100 bg-white p-8 shadow-soft hover:shadow-lg transition-all hover:-translate-y-1"
                  >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${feature.bg} ${feature.color} ${feature.hoverBg} group-hover:text-white transition-colors duration-300`}>
                      {feature.icon}
                    </div>
                    <div className="flex flex-col gap-3">
                      <h4 className="text-text-main text-xl font-bold">{t(feature.titleKey)}</h4>
                      <p className="text-text-sub leading-relaxed text-sm lg:text-base">
                        {t(feature.descKey)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-background-alt px-4 md:px-10">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="text-center max-w-3xl mx-auto flex flex-col gap-4 mb-16"
            >
              <h2 className="text-primary font-bold tracking-wider uppercase text-sm">{t('landingPage.howItWorks.title')}</h2>
              <h3 className="text-text-main text-3xl md:text-4xl font-black leading-tight tracking-tight">
                {t('landingPage.howItWorks.subtitle')}
              </h3>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {[
                {
                  step: "1",
                  titleKey: "landingPage.howItWorks.step1Title",
                  descKey: "landingPage.howItWorks.step1Desc",
                  color: "bg-primary"
                },
                {
                  step: "2",
                  titleKey: "landingPage.howItWorks.step2Title",
                  descKey: "landingPage.howItWorks.step2Desc",
                  color: "bg-secondary"
                },
                {
                  step: "3",
                  titleKey: "landingPage.howItWorks.step3Title",
                  descKey: "landingPage.howItWorks.step3Desc",
                  color: "bg-amber-500"
                }
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  variants={fadeInUp}
                  className="relative flex flex-col items-center text-center gap-4 p-8"
                >
                  <div className={`w-14 h-14 rounded-full ${item.color} text-white flex items-center justify-center text-2xl font-black shadow-lg`}>
                    {item.step}
                  </div>
                  {idx < 2 && (
                    <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gray-200">
                      <ChevronRight className="absolute -right-3 -top-2 text-gray-300 w-5 h-5" />
                    </div>
                  )}
                  <h4 className="text-text-main text-xl font-bold">{t(item.titleKey)}</h4>
                  <p className="text-text-sub leading-relaxed">{t(item.descKey)}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-white px-4 md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-7xl mx-auto w-full rounded-[2.5rem] bg-gradient-to-br from-primary to-blue-700 text-white p-12 md:p-20 relative overflow-hidden shadow-2xl"
          >
            {/* Background Patterns */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10 text-center md:text-left">
              <div className="flex flex-col gap-6 max-w-2xl">
                <h2 className="text-3xl md:text-5xl font-black leading-tight tracking-tight">
                  {t('landingPage.bottomCta.title')}
                </h2>
                <ul className="flex flex-col gap-2 text-blue-100 text-left">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-secondary" />
                    <span>{t('landingPage.bottomCta.benefit1', 'Gratis selamanya untuk penggunaan pribadi')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-secondary" />
                    <span>{t('landingPage.bottomCta.benefit2', 'Tidak perlu kartu kredit')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-secondary" />
                    <span>{t('landingPage.bottomCta.benefit3', 'Setup dalam 2 menit')}</span>
                  </li>
                </ul>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register">
                  <button className="flex min-w-[180px] cursor-pointer items-center justify-center rounded-full h-14 px-8 bg-white text-primary hover:bg-gray-50 shadow-lg hover:shadow-xl transition-all text-base font-bold tracking-wide">
                    {t('landingPage.bottomCta.ctaStart')}
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-background-alt border-t border-[#dadfe7] pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

            {/* Brand Column */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center text-text-main">
                <img src={`${import.meta.env.BASE_URL}logo.png`} alt="CatatToken.ID" className="h-6 object-contain" />
              </div>
              <p className="text-text-sub text-sm leading-relaxed">
                {t('landingPage.footer.tagline', 'Aplikasi monitoring listrik prabayar untuk pengguna Indonesia.')}
              </p>
            </div>

            {/* Product Links */}
            <div className="flex flex-col gap-3">
              <h4 className="text-text-main font-bold mb-1">{t('landingPage.footer.product', 'Produk')}</h4>
              <a href="#features" className="text-text-sub hover:text-primary transition-colors text-sm">{t('landingPage.features.title')}</a>
              <Link to="/login" className="text-text-sub hover:text-primary transition-colors text-sm">{t('btn_login')}</Link>
              <Link to="/register" className="text-text-sub hover:text-primary transition-colors text-sm">{t('landingPage.hero.ctaStart')}</Link>
            </div>

            {/* Support Links */}
            <div className="flex flex-col gap-3">
              <h4 className="text-text-main font-bold mb-1">{t('landingPage.footer.support', 'Dukungan')}</h4>
              <a href="#how-it-works" className="text-text-sub hover:text-primary transition-colors text-sm">{t('landingPage.howItWorks.title')}</a>
              <a href="mailto:support@catattoken.id" className="text-text-sub hover:text-primary transition-colors text-sm">{t('landingPage.footer.contact', 'Hubungi Kami')}</a>
            </div>

            {/* Legal Links */}
            <div className="flex flex-col gap-3">
              <h4 className="text-text-main font-bold mb-1">{t('landingPage.footer.legal', 'Legal')}</h4>
              <a href="#!" className="text-text-sub hover:text-primary transition-colors text-sm">{t('landingPage.footer.privacy', 'Kebijakan Privasi')}</a>
              <a href="#!" className="text-text-sub hover:text-primary transition-colors text-sm">{t('landingPage.footer.terms', 'Syarat & Ketentuan')}</a>
            </div>

          </div>

          <div className="h-px bg-[#dadfe7] w-full my-8" />

          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-text-sub text-sm">{t('landingPage.footer.copyright')}</p>
            <p className="text-text-sub text-sm">{t('landingPage.footer.madeWith', 'Dibuat dengan ❤️ di Indonesia')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
});

export default LandingPage;

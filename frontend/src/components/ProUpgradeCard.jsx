import React from 'react';
import { Sparkles, ArrowRight, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const ProUpgradeCard = ({ onClick }) => {
    const { t } = useTranslation();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            onClick={onClick}
            className="bg-white dark:bg-gray-800 border-2 border-primary/10 rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden cursor-pointer group shadow-soft hover:shadow-glow hover:border-primary/30 transition-all"
        >
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-primary/10 transition-all" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl -ml-10 -mb-10 group-hover:bg-amber-500/10 transition-all" />

            <div className="flex items-start justify-between z-10">
                <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg group-hover:bg-amber-100 dark:group-hover:bg-amber-500/20 transition-colors">
                    <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500/20" />
                </div>
                <div className="px-2 py-1 bg-amber-100/50 dark:bg-amber-500/20 rounded-full border border-amber-200 dark:border-amber-500/30 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                    Early Access
                </div>
            </div>

            <div className="z-10">
                <h4 className="font-bold text-text-main dark:text-white text-lg mb-1 group-hover:text-primary transition-colors">
                    {t('dashboard.proUpgrade.title', 'Pro Early Access')}
                </h4>
                <p className="text-sm text-text-sub dark:text-gray-400 leading-relaxed">
                    {t('dashboard.proUpgrade.desc', 'Be the first to try Multi-Meter & OCR features.')}
                </p>
            </div>

            <button className="w-full py-2.5 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group-hover:shadow-primary/30 z-10 mt-1">
                {t('dashboard.proUpgrade.cta', 'Join Waitlist')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
        </motion.div>
    );
};

export default ProUpgradeCard;

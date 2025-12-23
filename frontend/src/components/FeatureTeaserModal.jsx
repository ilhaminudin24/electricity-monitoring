import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    X,
    Store,
    Zap,
    FileText,
    ScanLine,
    Lock,
    ChevronRight,
    Camera,
    Crown
} from 'lucide-react';

const FeatureTeaserModal = ({ isOpen, onClose, featureId }) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    // Feature Configuration map
    const features = {
        MULTI_METER: {
            icon: Store,
            color: 'bg-blue-500',
            textColor: 'text-blue-500',
            lightColor: 'bg-blue-50',
            translationKey: 'multiMeter'
        },
        BUY_TOKEN: {
            icon: Zap,
            color: 'bg-amber-500',
            textColor: 'text-amber-500',
            lightColor: 'bg-amber-50',
            translationKey: 'buyToken'
        },
        REPORTS: {
            icon: FileText,
            color: 'bg-purple-600',
            textColor: 'text-purple-600',
            lightColor: 'bg-purple-50',
            translationKey: 'reports'
        },
        OCR_SCAN: {
            icon: ScanLine,
            color: 'bg-rose-500',
            textColor: 'text-rose-500',
            lightColor: 'bg-rose-50',
            translationKey: 'ocrScan'
        },
        OCR_METER: {
            icon: Camera,
            color: 'bg-emerald-500',
            textColor: 'text-emerald-500',
            lightColor: 'bg-emerald-50',
            translationKey: 'ocrMeter'
        },
        PRO_UPGRADE: {
            icon: Crown,
            color: 'bg-amber-500',
            textColor: 'text-amber-500',
            lightColor: 'bg-amber-50',
            translationKey: 'proUpgrade'
        }
    };

    const feature = features[featureId] || features.MULTI_METER;
    const Icon = feature.icon;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex flex-col items-center text-center p-6 md:p-8 pb-6">
                        {/* Animated Icon Header */}
                        <div className={`w-20 h-20 rounded-full ${feature.lightColor} ${feature.textColor} flex items-center justify-center mb-6 relative`}>
                            <Icon className="w-10 h-10" />
                            <div className="absolute -top-1 -right-1 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded-full border-2 border-white">
                                SOON
                            </div>
                        </div>

                        {/* Content */}
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {t(`featureTeaser.${feature.translationKey}.title`, 'Fitur Segera Hadir')}
                        </h3>
                        <p className="text-gray-500 leading-relaxed text-sm mb-6">
                            {t(`featureTeaser.${feature.translationKey}.desc`, 'Fitur ini sedang dalam pengembangan.')}
                        </p>

                        {/* Interest Button (Email Capture Mock) */}
                        <button
                            onClick={onClose}
                            className={`w-full h-12 rounded-xl ${feature.color} text-white font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-${feature.color}/20`}
                        >
                            <span>{t('featureTeaser.notifyMe', 'Beri Tahu Saya')}</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Footer Badge */}
                    <div className="bg-gray-50 py-3 px-6 flex items-center justify-center gap-2 border-t border-gray-100">
                        <Lock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">PRO FEATURE</span>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default FeatureTeaserModal;

import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Zap, ArrowLeft, X } from 'lucide-react';

const ReadingAnomalyModal = ({ isOpen, onClose, details, onSwitchToTopUp }) => {
    const { t } = useTranslation();

    if (!isOpen || !details) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white dark:bg-[#1a2332] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header - Red Error Style */}
                <div className="bg-red-50 dark:bg-red-900/20 px-6 py-6 border-b border-red-100 dark:border-red-900/30">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-100 dark:bg-red-800/30 rounded-full text-red-600 dark:text-red-400">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-red-700 dark:text-red-400">
                                {t('validation.readingIncreasedError')}
                            </h3>
                            <p className="text-red-600 dark:text-red-300 mt-1 text-sm leading-relaxed">
                                {t('validation.mustUseTopUp')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content - Data Visualization */}
                <div className="p-6">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6 border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">{t('validation.lastReadingWas')}</span>
                            <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{details.lastReading} kWh</span>
                        </div>
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-sm text-gray-500 dark:text-gray-400">{t('validation.newReadingIs')}</span>
                            <span className="font-mono font-bold text-gray-900 dark:text-white">{parseFloat(details.lastReading) + parseFloat(details.delta)} kWh</span>
                        </div>

                        <div className="h-px bg-gray-200 dark:bg-gray-700 w-full mb-3"></div>

                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-red-600 dark:text-red-400">{t('validation.differenceOf')}</span>
                            <span className="font-mono font-bold text-red-600 dark:text-red-400">+{details.delta} kWh</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {/* Primary Action: Switch to Top Up */}
                        <button
                            onClick={onSwitchToTopUp}
                            className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-energy-yellow hover:bg-yellow-500 text-gray-900 font-bold rounded-xl shadow-lg shadow-yellow-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Zap className="w-5 h-5 fill-current" />
                            {t('validation.switchToTopUp')}
                        </button>

                        {/* Secondary Action: Let me Fix */}
                        <button
                            onClick={onClose}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-semibold rounded-xl transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {t('validation.cancelCorrection')}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ReadingAnomalyModal;

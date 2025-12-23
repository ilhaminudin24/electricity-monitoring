
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Zap, ArrowRight, AlertTriangle, CheckCircle } from 'lucide-react';
import FeatureTeaserModal from '../FeatureTeaserModal';

const TokenPredictionCard = ({ daysRemaining, hasToken, remainingKwh }) => {
    const { t } = useTranslation();
    const [isBuyTokenOpen, setIsBuyTokenOpen] = useState(false);

    // Logic for display
    const isCritical = daysRemaining !== null && daysRemaining < 3;
    const isWarning = daysRemaining !== null && daysRemaining >= 3 && daysRemaining < 7;

    let displayDays = daysRemaining !== null ? daysRemaining : '-';

    // Calculate stroke dashoffset for gauge
    // Max days considered = 30 (for 100% circle)
    const maxDays = 30;
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const percentage = Math.min(100, Math.max(0, (daysRemaining / maxDays) * 100));
    const dashOffset = circumference - (percentage / 100) * circumference;

    let colorClass = "text-emerald-500";
    let strokeColor = "#10b981"; // emerald-500
    let bgColorClass = "bg-green-50 dark:bg-green-900/10";
    let borderColorClass = "border-green-100 dark:border-green-900/20";
    let icon = <CheckCircle className="w-5 h-5" />;
    let title = t('dashboard.healthyBalance');
    let desc = t('dashboard.healthyBalanceDesc');

    if (isCritical) {
        colorClass = "text-red-500";
        strokeColor = "#ef4444"; // red-500
        bgColorClass = "bg-red-50 dark:bg-red-900/10";
        borderColorClass = "border-red-100 dark:border-red-900/20";
        icon = <Zap className="w-5 h-5 text-alert-amber" />;
        title = t('dashboard.lowBalanceAlert');
        desc = t('dashboard.lowBalanceDesc');
    } else if (isWarning) {
        colorClass = "text-yellow-500";
        strokeColor = "#eab308";
        bgColorClass = "bg-yellow-50 dark:bg-yellow-900/10";
        borderColorClass = "border-yellow-100 dark:border-yellow-900/20";
        icon = <AlertTriangle className="w-5 h-5 text-yellow-500" />;
        title = t('dashboard.tokenRunningLow');
        desc = t('dashboard.tokenRunningLowDesc');
    } else if (!hasToken) {
        title = t('dashboard.setupRequired');
        desc = t('dashboard.setupRequiredDesc');
        colorClass = "text-gray-400";
        strokeColor = "#94a3b8";
        icon = <AlertTriangle className="w-5 h-5 text-gray-400" />;
        displayDays = '?';
    }

    return (
        <>
            <FeatureTeaserModal
                isOpen={isBuyTokenOpen}
                onClose={() => setIsBuyTokenOpen(false)}
                featureId="BUY_TOKEN"
            />
            <div className={`flex flex-col sm:flex-row items-center justify-between p-6 rounded-2xl shadow-soft border hover:shadow-lg transition-shadow relative overflow-hidden h-full bg-white dark:bg-background-dark ${borderColorClass}`}>
                {/* Background Accent */}
                <div className={`absolute right-0 top-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none ${isCritical ? 'bg-alert-amber/5' : 'bg-primary/5'}`}></div>

                <div className="flex flex-col gap-4 z-10 w-full sm:w-1/2">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            {icon}
                            <p className="text-text-sub text-sm font-semibold uppercase tracking-wider">{t('dashboard.tokenPrediction')}</p>
                        </div>
                        <h3 className="text-2xl md:text-3xl font-bold text-text-main dark:text-white leading-tight">
                            {title}
                        </h3>
                        {/* Added Remaining Kwh Display */}
                        {remainingKwh !== undefined && remainingKwh !== null && (
                            <p className="text-lg font-medium text-text-main dark:text-gray-200 mt-1">
                                {remainingKwh} <span className="text-sm text-gray-500">{t('dashboard.kwhRemaining')}</span>
                            </p>
                        )}
                    </div>
                    <p className="text-text-sub text-sm leading-relaxed">
                        {desc}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-4">
                        <Link to="/input">
                            <button className={`px-5 py-2.5 text-white text-sm font-bold rounded-full shadow-lg transition-colors flex items-center gap-2 ${isCritical ? 'bg-alert-amber hover:bg-amber-600 shadow-alert-amber/30' : 'bg-primary hover:bg-blue-600 shadow-primary/30'}`}>
                                <span>{hasToken ? t('dashboard.topUpNow') : t('dashboard.startTracking')}</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </Link>

                        {/* Upsell Button */}
                        <button
                            onClick={() => setIsBuyTokenOpen(true)}
                            className="px-5 py-2.5 bg-white dark:bg-gray-800 text-amber-500 border border-amber-200 dark:border-amber-900/30 text-sm font-bold rounded-full hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all flex items-center gap-2"
                        >
                            <Zap className="w-4 h-4" />
                            <span>{t('featureTeaser.buyToken.title', 'Buy Token')}</span>
                        </button>
                    </div>
                </div>

                {/* Gauge Visual */}
                <div className="relative w-40 h-40 md:w-48 md:h-48 flex items-center justify-center shrink-0 mt-6 sm:mt-0">
                    <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                        {/* Background Circle */}
                        <circle
                            className="text-gray-200 dark:text-gray-700 stroke-current"
                            cx="50" cy="50" r={radius} fill="none" strokeWidth="8"
                        ></circle>
                        {/* Progress Circle */}
                        <circle
                            cx="50" cy="50" r={radius} fill="none"
                            stroke={strokeColor}
                            strokeWidth="8"
                            strokeDasharray={circumference}
                            strokeDashoffset={hasToken ? dashOffset : circumference}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                        ></circle>
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <span className="text-3xl font-black text-text-main dark:text-white">
                            {displayDays}
                        </span>
                        <span className="text-xs font-bold text-gray-400 uppercase">{t('dashboard.daysLeft')}</span>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TokenPredictionCard;

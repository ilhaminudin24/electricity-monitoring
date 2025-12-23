
import React from 'react';
import { useTranslation } from 'react-i18next';
import { BadgeDollarSign } from 'lucide-react';
import { formatRupiah } from '../../utils/rupiah';
import { getBudgetForPeriod, getBudgetAlertThreshold } from '../../utils/settings';

const EstCostCard = ({ estimatedCost, dailyAverageCost, timeRange = 'month' }) => {
    const { t } = useTranslation();
    // Get dynamic budget from settings
    const periodBudget = getBudgetForPeriod(timeRange);
    const alertThreshold = getBudgetAlertThreshold();

    // Set period labels based on timeRange
    let periodLabel = t('dashboard.thisMonth');
    let avgLabel = t('dashboard.dailyAvg');

    if (timeRange === 'day') {
        periodLabel = t('dashboard.last7Days');
        avgLabel = t('dashboard.dailyAvg');
    } else if (timeRange === 'week') {
        periodLabel = t('dashboard.last4Weeks');
        avgLabel = t('dashboard.weeklyAvg');
    } else if (timeRange === 'month') {
        periodLabel = t('dashboard.last6Months');
        avgLabel = t('dashboard.monthlyAvg');
    }

    // Calculate percentage of budget used (handle zero budget gracefully)
    const percentage = periodBudget > 0
        ? Math.min(100, Math.max(0, (estimatedCost / periodBudget) * 100))
        : 0;

    // Decide color based on percentage and dynamic alert threshold
    let progressColor = "bg-green-500";
    if (percentage > alertThreshold - 35) progressColor = "bg-yellow-500"; // Warning zone
    if (percentage > alertThreshold) progressColor = "bg-red-500";         // Danger zone

    return (
        <div className="flex flex-col p-6 bg-white dark:bg-background-dark rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-shadow relative overflow-hidden h-full">
            <div className="z-10 relative flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <p className="text-text-sub text-sm font-semibold uppercase tracking-wider">{t('dashboard.estCost')}</p>
                            <span className="text-xs text-text-sub bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                {periodLabel}
                            </span>
                        </div>
                        <p className="text-3xl font-bold text-text-main dark:text-white">
                            {formatRupiah(estimatedCost)}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 flex items-center justify-center">
                        <BadgeDollarSign className="w-6 h-6" />
                    </div>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{avgLabel}</span>
                        <span className="font-semibold text-text-main dark:text-gray-200">
                            {formatRupiah(dailyAverageCost)}
                        </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-500 ${progressColor}`}
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                        {Math.round(percentage)}% {t('dashboard.ofBudget')} {periodLabel.toLowerCase()} {t('dashboard.budget')} ({formatRupiah(periodBudget)})
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EstCostCard;

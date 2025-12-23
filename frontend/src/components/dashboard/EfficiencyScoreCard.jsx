import React from 'react';
import { useTranslation } from 'react-i18next';
import { Target, TrendingUp, TrendingDown, Minus, Wallet, Activity, Lightbulb, Info } from 'lucide-react';

/**
 * EfficiencyScoreCard - Gamified efficiency score display
 * Shows score 0-100, grade, and breakdown of 3 components with explanations
 */
const EfficiencyScoreCard = ({
    score = null,
    hasData = false,
    message = ''
}) => {
    const { t } = useTranslation();

    // Destructure score data if available
    const totalScore = score?.totalScore || 0;
    const grade = score?.grade || '-';
    const consistencyScore = score?.consistencyScore || 0;
    const budgetScore = score?.budgetScore || 0;
    const trendScore = score?.trendScore || 0;
    const tips = score?.tips || [];
    const breakdown = score?.breakdown || {};

    // Get grade color
    const getGradeColor = (g) => {
        switch (g) {
            case 'A+':
            case 'A':
                return { text: 'text-emerald-500', bg: 'bg-emerald-500', ring: 'stroke-emerald-500', light: 'bg-emerald-50 dark:bg-emerald-900/20' };
            case 'B':
                return { text: 'text-blue-500', bg: 'bg-blue-500', ring: 'stroke-blue-500', light: 'bg-blue-50 dark:bg-blue-900/20' };
            case 'C':
                return { text: 'text-amber-500', bg: 'bg-amber-500', ring: 'stroke-amber-500', light: 'bg-amber-50 dark:bg-amber-900/20' };
            case 'D':
                return { text: 'text-orange-500', bg: 'bg-orange-500', ring: 'stroke-orange-500', light: 'bg-orange-50 dark:bg-orange-900/20' };
            default:
                return { text: 'text-red-500', bg: 'bg-red-500', ring: 'stroke-red-500', light: 'bg-red-50 dark:bg-red-900/20' };
        }
    };

    const gradeColors = getGradeColor(grade);

    // SVG Progress Ring
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const progress = hasData ? (totalScore / 100) * circumference : 0;
    const offset = circumference - progress;

    // Get score status
    const getScoreStatus = (pts, maxPts) => {
        const ratio = pts / maxPts;
        if (ratio >= 0.7) return { icon: '✓', color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' };
        if (ratio >= 0.5) return { icon: '!', color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' };
        return { icon: '✗', color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' };
    };

    // Get tip message with icon
    const getTipData = (tipType) => {
        switch (tipType) {
            case 'consistency':
                return {
                    icon: <Activity className="w-4 h-4" />,
                    title: t('dashboard.tipConsistencyTitle', 'Pemakaian Tidak Stabil'),
                    message: t('dashboard.tipConsistency', 'Jadwalkan penggunaan AC/mesin cuci lebih merata.')
                };
            case 'budget':
                return {
                    icon: <Wallet className="w-4 h-4" />,
                    title: t('dashboard.tipBudgetTitle', 'Melebihi Budget'),
                    message: t('dashboard.tipBudget', 'Kurangi pemakaian atau naikkan budget di Settings.')
                };
            case 'trend':
                return {
                    icon: <TrendingUp className="w-4 h-4" />,
                    title: t('dashboard.tipTrendTitle', 'Pemakaian Naik'),
                    message: t('dashboard.tipTrend', 'Periksa perangkat yang tidak efisien.')
                };
            default:
                return null;
        }
    };

    // Get grade message
    const getGradeMessage = (g) => {
        switch (g) {
            case 'A+': return t('dashboard.gradeAPlus', 'Luar biasa! Sangat efisien.');
            case 'A': return t('dashboard.gradeA', 'Bagus sekali! Pertahankan.');
            case 'B': return t('dashboard.gradeB', 'Baik. Masih bisa ditingkatkan.');
            case 'C': return t('dashboard.gradeC', 'Cukup. Perlu perhatian.');
            case 'D': return t('dashboard.gradeD', 'Kurang. Perlu perbaikan.');
            default: return t('dashboard.gradeF', 'Perlu perbaikan segera.');
        }
    };

    // Get component explanation
    const getComponentExplanation = (type) => {
        switch (type) {
            case 'consistency':
                return t('dashboard.consistencyExplain', 'Seberapa stabil pemakaian harian');
            case 'budget':
                return t('dashboard.budgetExplain', 'Apakah sesuai anggaran bulanan');
            case 'trend':
                return t('dashboard.trendExplain', 'Dibanding minggu lalu');
            default:
                return '';
        }
    };

    // Empty state
    if (!hasData) {
        return (
            <div className="p-6 bg-white dark:bg-background-dark rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-bold text-text-main dark:text-white">
                        {t('dashboard.efficiencyScore', 'Skor Efisiensi')}
                    </h3>
                </div>
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <Target className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-sm text-center">
                        {message || t('dashboard.needMoreData', 'Butuh minimal 7 hari data')}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white dark:bg-background-dark rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-bold text-text-main dark:text-white">
                        {t('dashboard.efficiencyScore', 'Skor Efisiensi')}
                    </h3>
                </div>
            </div>

            {/* Main Content - Score + Grade Message */}
            <div className="flex items-center gap-6 mb-6">
                {/* Score Ring */}
                <div className="relative flex-shrink-0">
                    <svg width="100" height="100" className="transform -rotate-90">
                        <circle
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="8"
                            className="dark:stroke-gray-700"
                        />
                        <circle
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="none"
                            className={gradeColors.ring}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-2xl font-bold ${gradeColors.text}`}>{totalScore}</span>
                        <span className="text-xs text-gray-400">/100</span>
                    </div>
                </div>

                {/* Grade & Message */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${gradeColors.text} ${gradeColors.light}`}>
                            Grade {grade}
                        </span>
                    </div>
                    <p className="text-sm text-text-sub">
                        {getGradeMessage(grade)}
                    </p>
                </div>
            </div>

            {/* Breakdown Cards - With Explanations */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                {/* Consistency */}
                <div className={`p-3 rounded-xl ${getScoreStatus(consistencyScore, 30).bg}`}>
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                            <Activity className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                {t('dashboard.consistency', 'Konsistensi')}
                            </span>
                        </div>
                        <span className={`text-xs font-bold ${getScoreStatus(consistencyScore, 30).color}`}>
                            {getScoreStatus(consistencyScore, 30).icon}
                        </span>
                    </div>
                    <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-xl font-bold text-text-main dark:text-white">{consistencyScore}</span>
                        <span className="text-xs text-gray-400">/30</span>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-tight">
                        {getComponentExplanation('consistency')}
                    </p>
                </div>

                {/* Budget */}
                <div className={`p-3 rounded-xl ${getScoreStatus(budgetScore, 40).bg}`}>
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                            <Wallet className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                {t('dashboard.budget', 'Budget')}
                            </span>
                        </div>
                        <span className={`text-xs font-bold ${getScoreStatus(budgetScore, 40).color}`}>
                            {getScoreStatus(budgetScore, 40).icon}
                        </span>
                    </div>
                    <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-xl font-bold text-text-main dark:text-white">{budgetScore}</span>
                        <span className="text-xs text-gray-400">/40</span>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-tight">
                        {getComponentExplanation('budget')}
                    </p>
                </div>

                {/* Trend */}
                <div className={`p-3 rounded-xl ${getScoreStatus(trendScore, 30).bg}`}>
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                            {breakdown?.trend?.changePct < 0 ? (
                                <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
                            ) : breakdown?.trend?.changePct > 0 ? (
                                <TrendingUp className="w-3.5 h-3.5 text-red-500" />
                            ) : (
                                <Minus className="w-3.5 h-3.5 text-gray-500" />
                            )}
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                {t('dashboard.trend', 'Tren')}
                            </span>
                        </div>
                        <span className={`text-xs font-bold ${getScoreStatus(trendScore, 30).color}`}>
                            {getScoreStatus(trendScore, 30).icon}
                        </span>
                    </div>
                    <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-xl font-bold text-text-main dark:text-white">{trendScore}</span>
                        <span className="text-xs text-gray-400">/30</span>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-tight">
                        {getComponentExplanation('trend')}
                        {breakdown?.trend?.changePct !== undefined && (
                            <span className={breakdown.trend.changePct < 0 ? 'text-emerald-600' : breakdown.trend.changePct > 0 ? 'text-red-500' : ''}>
                                {' '}({breakdown.trend.changePct > 0 ? '+' : ''}{breakdown.trend.changePct}%)
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {/* Tips Section - Always show if there are tips */}
            {tips.length > 0 && (
                <div className="space-y-2">
                    {tips.slice(0, 2).map((tipType, idx) => {
                        const tipData = getTipData(tipType);
                        if (!tipData) return null;
                        return (
                            <div
                                key={idx}
                                className="flex items-start gap-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200/50 dark:border-amber-800/50"
                            >
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-800/30 flex items-center justify-center text-amber-600">
                                    <Lightbulb className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                        {tipData.title}
                                    </p>
                                    <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-0.5">
                                        {tipData.message}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* All Good Message - Show when no tips */}
            {tips.length === 0 && (
                <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200/50 dark:border-emerald-800/50">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800/30 flex items-center justify-center text-emerald-600">
                        <span className="text-lg">🎉</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                            {t('dashboard.allGood', 'Semuanya baik!')}
                        </p>
                        <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80">
                            {t('dashboard.keepItUp', 'Pertahankan pola pemakaian Anda.')}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EfficiencyScoreCard;

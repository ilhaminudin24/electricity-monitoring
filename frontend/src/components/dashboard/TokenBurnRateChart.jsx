import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import { format } from 'date-fns';
import { id as idLocale, enUS } from 'date-fns/locale';
import i18n from '../../i18n';

const TokenBurnRateChart = ({
    projectionData = [],
    remainingKwh = 0,
    daysRemaining = null,
    depletionDate = null,
    avgDailyUsage = 0,
    criticalKwh = 0,
    warningKwh = 0,
    hasData = false
}) => {
    const { t } = useTranslation();
    // Use i18n.language to determine locale
    const dateLocale = i18n.language === 'id' ? idLocale : enUS;

    // Determine status
    const isCritical = daysRemaining !== null && daysRemaining <= 3;
    const isWarning = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 3;

    // Get status color and label
    const getStatusInfo = () => {
        if (isCritical) {
            return {
                color: 'text-red-500',
                bgColor: 'bg-red-50 dark:bg-red-900/20',
                borderColor: 'border-red-200 dark:border-red-800',
                label: t('dashboard.criticalWarning'),
                dotColor: 'bg-red-500'
            };
        }
        if (isWarning) {
            return {
                color: 'text-amber-500',
                bgColor: 'bg-amber-50 dark:bg-amber-900/20',
                borderColor: 'border-amber-200 dark:border-amber-800',
                label: t('dashboard.warningZone'),
                dotColor: 'bg-amber-500'
            };
        }
        return {
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
            borderColor: 'border-emerald-200 dark:border-emerald-800',
            label: t('dashboard.safeZone'),
            dotColor: 'bg-emerald-500'
        };
    };

    const status = getStatusInfo();

    // Format date for X axis
    const formatXAxis = (dateStr) => {
        if (!dateStr) return '';
        try {
            return format(new Date(dateStr), 'd MMM', { locale: dateLocale });
        } catch (e) {
            return dateStr;
        }
    };

    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const isToday = data.dayIndex === 0;

            return (
                <div className="bg-slate-800 text-white p-3 rounded-lg shadow-xl border border-slate-700">
                    <p className="text-xs text-gray-400 mb-1">
                        {isToday ? t('dashboard.today') : format(new Date(label), 'EEEE, d MMM yyyy', { locale: dateLocale })}
                    </p>
                    <p className="text-sm font-bold">
                        {data.kwhRemaining.toFixed(1)} <span className="text-xs font-normal">kWh</span>
                    </p>
                    {!isToday && (
                        <p className="text-xs text-gray-400 mt-1">
                            {t('dashboard.dayIndex', { days: data.dayIndex })}
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    // Get gradient ID based on status
    const gradientId = isCritical ? 'criticalGradient' : isWarning ? 'warningGradient' : 'safeGradient';

    // No data state
    if (!hasData || projectionData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[260px] text-gray-400">
                <svg className="w-12 h-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-sm">{t('dashboard.noTokenData')}</p>
                <p className="text-xs mt-1">{t('dashboard.addTokenInfo')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with Status Badge */}
            <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                    <h3 className="text-lg font-bold text-text-main dark:text-white">
                        {t('dashboard.tokenBurnRate')}
                    </h3>
                    <p className="text-sm text-text-sub">
                        {t('dashboard.basedOnAvg', { days: 30 })}
                    </p>
                </div>

                {/* Status Badge */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${status.bgColor} ${status.borderColor} border`}>
                    <span className={`w-2 h-2 rounded-full ${status.dotColor} animate-pulse`}></span>
                    <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <p className="text-2xl font-bold text-text-main dark:text-white">{remainingKwh.toFixed(1)}</p>
                    <p className="text-xs text-text-sub">kWh {t('dashboard.remaining')}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <p className={`text-2xl font-bold ${status.color}`}>
                        {daysRemaining !== null ? daysRemaining : '-'}
                    </p>
                    <p className="text-xs text-text-sub">{t('dashboard.daysLeft')}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <p className="text-lg font-bold text-text-main dark:text-white">
                        {depletionDate ? format(new Date(depletionDate), 'd MMM', { locale: dateLocale }) : '-'}
                    </p>
                    <p className="text-xs text-text-sub">{t('dashboard.estimatedEmpty')}</p>
                </div>
            </div>

            {/* Chart */}
            <div className="w-full h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={projectionData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="safeGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="warningGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="criticalGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />

                        <XAxis
                            dataKey="date"
                            tickFormatter={formatXAxis}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                            tickMargin={8}
                            interval="preserveStartEnd"
                        />

                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                            width={35}
                            domain={[0, 'auto']}
                        />

                        <Tooltip content={<CustomTooltip />} />

                        {/* Warning threshold line */}
                        {warningKwh > 0 && (
                            <ReferenceLine
                                y={warningKwh}
                                stroke="#f59e0b"
                                strokeDasharray="4 4"
                                strokeWidth={1}
                                label={{
                                    value: '7d',
                                    position: 'right',
                                    fill: '#f59e0b',
                                    fontSize: 10
                                }}
                            />
                        )}

                        {/* Critical threshold line */}
                        {criticalKwh > 0 && (
                            <ReferenceLine
                                y={criticalKwh}
                                stroke="#ef4444"
                                strokeDasharray="4 4"
                                strokeWidth={1}
                                label={{
                                    value: '3d',
                                    position: 'right',
                                    fill: '#ef4444',
                                    fontSize: 10
                                }}
                            />
                        )}

                        <Area
                            type="monotone"
                            dataKey="kwhRemaining"
                            stroke={isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981'}
                            strokeWidth={2.5}
                            fill={`url(#${gradientId})`}
                            dot={(props) => {
                                const { cx, cy, payload } = props;
                                // Only show dot for first (actual) and last point
                                if (payload.isActual) {
                                    return (
                                        <g key={`dot-${payload.date}`}>
                                            <circle cx={cx} cy={cy} r={6} fill="#ffffff" stroke="#10b981" strokeWidth={2} />
                                            <circle cx={cx} cy={cy} r={3} fill="#10b981" />
                                        </g>
                                    );
                                }
                                if (payload.dayIndex === projectionData.length - 1) {
                                    const endColor = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';
                                    return (
                                        <g key={`dot-end-${payload.date}`}>
                                            <circle cx={cx} cy={cy} r={6} fill="#ffffff" stroke={endColor} strokeWidth={2} />
                                            <circle cx={cx} cy={cy} r={3} fill={endColor} />
                                        </g>
                                    );
                                }
                                return <circle key={`dot-${payload.date}`} cx={cx} cy={cy} r={0} />;
                            }}
                            activeDot={{ r: 5, strokeWidth: 0, fill: isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Footer info */}
            <p className="text-xs text-center text-text-sub">
                {t('dashboard.avgUsage')}: <span className="font-medium">{avgDailyUsage.toFixed(2)} kWh/{t('dashboard.perDay')}</span>
            </p>
        </div>
    );
};

export default TokenBurnRateChart;

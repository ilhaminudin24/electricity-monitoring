
import React from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, Cell } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

const TotalUsageCard = ({
    totalKwh,
    trendPercentage,
    chartData = [],
    timeRange
}) => {
    const { t } = useTranslation();
    const isPositive = trendPercentage >= 0;



    // Helper to get title based on range
    const getRangeTitle = () => {
        switch (timeRange) {
            case 'day': return t('dashboard.last7Days');
            case 'week': return t('dashboard.last4Weeks');
            case 'month': return t('dashboard.last6Months');
            default: return t('dashboard.totalUsage');
        }
    };

    return (
        <div className="flex flex-col justify-between p-6 bg-white dark:bg-background-dark rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-shadow h-full">

            {/* Header */}
            <div className="flex flex-col gap-2 mb-2">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                        <p className="text-text-sub text-sm font-semibold uppercase tracking-wider">
                            {t('dashboard.totalUsage')}
                        </p>
                        <p className="text-3xl font-bold text-text-main dark:text-white">
                            {totalKwh !== undefined && totalKwh !== null ? totalKwh : '-'}
                            <span className="text-lg font-medium text-gray-400 ml-1">kWh</span>
                        </p>
                    </div>

                    {/* Trend Badge */}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${isPositive ? 'bg-energy-teal/10 text-energy-teal' : 'bg-red-100 text-red-600'
                        }`}>
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(trendPercentage)}%
                    </span>
                </div>

                {/* Range Title Badge */}
                <span className="text-xs text-text-sub bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-full w-fit">
                    {getRangeTitle()}
                </span>
            </div>

            {/* Chart Area */}
            <div className="w-full mt-4 relative h-40">
                <p className="text-xs text-text-sub mb-2 absolute -top-6 right-0">{getRangeTitle()}</p>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 20 }}>
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-xl border border-gray-100 dark:border-slate-700">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
                                            {data.isTopUp ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{t('dashboard.tokenTopUp')}</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                        {payload[0].value.toFixed(2)} <span className="text-xs font-normal text-gray-500">kWh</span>
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 mt-1 italic">
                                                        {t('dashboard.distributedUsage')}
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                            interval={timeRange === 'month' ? 4 : (timeRange === 'week' ? 0 : 'preserveStartEnd')}
                        />
                        <Bar
                            dataKey="value"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={
                                        entry.isTopUp
                                            ? '#3b82f6' // Blue for Top Up
                                            : (index === chartData.length - 1 ? '#10b981' : '#e5e7eb')
                                    }
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TotalUsageCard;

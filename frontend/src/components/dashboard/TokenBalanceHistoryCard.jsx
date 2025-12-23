import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import { format } from 'date-fns';

/**
 * TokenBalanceHistoryCard - Displays token balance history over last 30 days
 * Extracted from MainUsageChart for better layout modularity
 */
const TokenBalanceHistoryCard = ({ dailyData = [] }) => {
    const { t } = useTranslation();

    // Token Balance data (meterValue = remaining kWh)
    // Always show last 30 days regardless of global filter
    const balanceData = useMemo(() => {
        const sorted = [...dailyData].sort((a, b) => new Date(a.date) - new Date(b.date));
        const filtered = sorted.slice(-30);
        return filtered.filter(d => d.meterValue !== null && d.meterValue !== undefined);
    }, [dailyData]);

    const BalanceTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const balance = data.meterValue;
            return (
                <div className="bg-slate-800 text-white p-3 rounded-lg shadow-xl border border-slate-700">
                    <p className="text-xs text-gray-400 mb-1">{format(new Date(label), 'dd MMM yyyy')}</p>
                    <div className="space-y-1">
                        {data.isTopUp && (
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                <p className="text-sm font-bold text-emerald-400">{t('dashboard.tokenTopUp')}</p>
                            </div>
                        )}
                        <p className="text-sm font-bold">
                            Balance: <span className="font-normal">{balance?.toFixed(2)} kWh</span>
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (balanceData.length === 0) {
        return (
            <div className="bg-white dark:bg-background-dark rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 p-6 h-full flex items-center justify-center">
                <p className="text-text-sub text-center">{t('dashboard.noBalanceData', 'Belum ada data saldo token')}</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-background-dark rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 p-6 h-full">
            <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                <div>
                    <h3 className="text-lg font-bold text-text-main dark:text-white">{t('dashboard.tokenBalanceHistory')}</h3>
                    <p className="text-sm text-text-sub">{t('dashboard.kwhRemaining')}</p>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>

            <div className="w-full h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={balanceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                        <XAxis
                            dataKey="date"
                            tickFormatter={(d) => format(new Date(d), 'dd')}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                            width={35}
                        />
                        <Tooltip content={<BalanceTooltip />} />

                        {balanceData.filter(d => d.isTopUp).map((d, i) => (
                            <ReferenceLine
                                key={`topup-${i}`}
                                x={d.date}
                                stroke="#10b981"
                                strokeDasharray="4 4"
                                strokeWidth={1.5}
                            />
                        ))}

                        <Line
                            type="monotone"
                            dataKey="meterValue"
                            stroke="#10b981"
                            strokeWidth={2.5}
                            dot={(props) => {
                                const { cx, cy, payload } = props;
                                if (payload.isTopUp) {
                                    return (
                                        <g key={`dot-${payload.date}`}>
                                            <circle cx={cx} cy={cy} r={6} fill="#10b981" fillOpacity={0.2} />
                                            <circle cx={cx} cy={cy} r={4} fill="#ffffff" stroke="#10b981" strokeWidth={2} />
                                        </g>
                                    );
                                }
                                return <circle key={`dot-${payload.date}`} cx={cx} cy={cy} r={0} />;
                            }}
                            activeDot={{ r: 5, strokeWidth: 0, fill: '#10b981' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TokenBalanceHistoryCard;

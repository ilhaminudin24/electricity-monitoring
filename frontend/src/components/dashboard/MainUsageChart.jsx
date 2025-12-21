import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ReferenceLine
} from 'recharts';
import { format } from 'date-fns';
import { getSettings } from '../../utils/settings';

const MainUsageChart = ({ dailyData = [], weeklyData = [], monthlyData = [], timeRange = 'day' }) => {
    const { t } = useTranslation();
    // timeRange received from parent via global filter
    const settings = getSettings();
    const tariff = settings.tariffPerKwh || 1444.70;

    // Check if today has data for daily view logic
    const todayStr = new Date().toISOString().split('T')[0];
    const hasTodayData = useMemo(() => {
        return dailyData.some(d => d.date === todayStr && d.usage_kwh > 0);
    }, [dailyData, todayStr]);

    // Determine if we should use fallback mode for daily view
    const useDailyFallback = timeRange === 'day' && !hasTodayData;

    const chartData = useMemo(() => {
        let data = [];

        // Sort daily data first for slicing
        const sortedDaily = [...dailyData].sort((a, b) => new Date(a.date) - new Date(b.date));

        switch (timeRange) {
            case 'week':
                // Use weekly aggregated data as-is
                data = [...weeklyData];
                break;
            case 'month':
                data = [...monthlyData];
                break;
            case 'day':
            default:
                if (hasTodayData) {
                    // Today vs Yesterday - last 2 data points
                    data = sortedDaily.slice(-2).map((d, idx, arr) => ({
                        ...d,
                        displayLabel: idx === arr.length - 1 ? t('dashboard.today') : t('time.yesterday')
                    }));
                } else {
                    // Fallback: Last 7 days trend
                    data = sortedDaily.slice(-7);
                }
                break;
        }

        // Sort data chronologically to ensure Left (Oldest) -> Right (Newest)
        return data.sort((a, b) => {
            const dateA = new Date(a.date || a.startDate || a.month);
            const dateB = new Date(b.date || b.startDate || b.month);
            return dateA - dateB;
        });
    }, [timeRange, dailyData, weeklyData, monthlyData, hasTodayData]);

    // Derived data for Scatter plot (Top Ups only)
    const topUpData = useMemo(() => {
        return chartData.filter(d => d.isTopUp).map(d => ({
            ...d,
            // Force value to 0 if it's not already, or keep distinct. 
            // Since top-up usually means 0 consumption in our logic, it sits on the line.
            usage_kwh: 0
        }));
    }, [chartData]);

    const sortedMonthlyData = useMemo(() => {
        return [...monthlyData].sort((a, b) => new Date(a.month) - new Date(b.month));
    }, [monthlyData]);

    // Token Balance data (meterValue = remaining kWh)
    const balanceData = useMemo(() => {
        // Use dailyData which has meterValue from computeDailyUsage
        const sorted = [...dailyData].sort((a, b) => new Date(a.date) - new Date(b.date));

        // Filter based on timeRange
        let filtered = sorted;
        if (timeRange === 'day') {
            filtered = sorted.slice(-7); // Last 7 days for day view
        } else if (timeRange === 'week') {
            filtered = sorted.slice(-30); // Last 30 days for week view
        } else {
            filtered = sorted.slice(-60); // Last 60 days for month view 
        }

        return filtered.filter(d => d.meterValue !== null && d.meterValue !== undefined);
    }, [dailyData, timeRange]);

    // Custom Tick Formatter - handles different views
    const formatXAxis = (tickItem, payload) => {
        if (!tickItem) return '';
        try {
            // For daily view with displayLabel (Today/Yesterday)
            if (timeRange === 'day') {
                // Find the data point to check for displayLabel
                const dataPoint = chartData.find(d => d.date === tickItem || d.startDate === tickItem);
                if (dataPoint?.displayLabel) {
                    return dataPoint.displayLabel;
                }
                return format(new Date(tickItem), 'dd MMM');
            }
            // For weekly view: show date range like "Dec 16-22"
            if (timeRange === 'week') {
                const dataPoint = chartData.find(d => d.startDate === tickItem);
                if (dataPoint?.startDate && dataPoint?.endDate) {
                    const start = new Date(dataPoint.startDate);
                    const end = new Date(dataPoint.endDate);
                    const startDay = format(start, 'd');
                    const endDay = format(end, 'd');
                    const month = format(start, 'MMM');
                    return `${month} ${startDay}-${endDay}`;
                }
                return format(new Date(tickItem), 'dd MMM');
            }
            if (timeRange === 'month') return format(new Date(tickItem), 'MMM yyyy');
            return tickItem;
        } catch (e) {
            return tickItem;
        }
    };

    const formatMonthXAxis = (tickItem) => {
        if (!tickItem) return '';
        try {
            return format(new Date(tickItem), 'MMM');
        } catch (e) {
            return tickItem;
        }
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            // Check if any payload has isTopUp true
            const isTopUp = payload.some(p => p.payload.isTopUp);
            const dataPoint = payload[0];

            return (
                <div className="bg-slate-800 text-white p-3 rounded-lg shadow-xl border border-slate-700">
                    <p className="text-xs text-gray-400 mb-1">{formatXAxis(label)}</p>
                    {isTopUp ? (
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                            <p className="text-sm font-bold text-blue-400">{t('dashboard.tokenTopUp')}</p>
                        </div>
                    ) : (
                        <p className="text-sm font-bold">
                            {dataPoint.value.toFixed(2)} <span className="text-xs font-normal">kWh</span>
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    const MonthlyTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const kwh = payload[0].value;
            const cost = kwh * tariff;
            return (
                <div className="bg-slate-800 text-white p-3 rounded-lg shadow-xl border border-slate-700">
                    <p className="text-xs text-gray-400 mb-1">{format(new Date(label), 'MMMM yyyy')}</p>
                    <div className="space-y-1">
                        <p className="text-sm font-bold">
                            Usage: <span className="font-normal">{kwh.toFixed(2)} kWh</span>
                        </p>
                        <p className="text-sm font-bold text-emerald-400">
                            Est. Cost: <span className="font-normal">Rp {cost.toLocaleString('id-ID')}</span>
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

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

    return (
        <div className="p-6 bg-white dark:bg-background-dark rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 h-full flex flex-col gap-6">

            {/* TOP SECTION: Side-by-side layout for Consumption + Token Balance */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* LEFT: Consumption Trends (60% width = 3/5) */}
                <div className="lg:col-span-3">
                    <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-text-main dark:text-white">{t('dashboard.consumptionTrends')}</h3>
                            <p className="text-sm text-text-sub">
                                {timeRange === 'day'
                                    ? (useDailyFallback ? t('dashboard.last7Days') : t('dashboard.todayVsYesterday'))
                                    : timeRange === 'week'
                                        ? t('dashboard.last7Days')
                                        : t('dashboard.last30Days')}
                            </p>
                        </div>
                        <span className="text-xs text-text-sub bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full font-medium capitalize">
                            {timeRange === 'day' ? t('dashboard.today') : timeRange === 'week' ? t('dashboard.thisWeek') : t('dashboard.thisMonth')}
                        </span>
                    </div>

                    <div className="w-full h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                            {/* Weekly View: Use Bar Chart */}
                            {timeRange === 'week' ? (
                                <BarChart
                                    data={chartData}
                                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                    <XAxis
                                        dataKey="startDate"
                                        tickFormatter={formatXAxis}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                        tickMargin={8}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                        width={40}
                                    />
                                    <Tooltip
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                const startDate = data.startDate ? format(new Date(data.startDate), 'MMM d') : '';
                                                const endDate = data.endDate ? format(new Date(data.endDate), 'd') : '';
                                                return (
                                                    <div className="bg-slate-800 text-white p-3 rounded-lg shadow-xl border border-slate-700">
                                                        <p className="text-xs text-gray-400 mb-1">{startDate}-{endDate}</p>
                                                        <p className="text-sm font-bold">
                                                            {payload[0].value?.toFixed(2)} <span className="text-xs font-normal">kWh</span>
                                                        </p>
                                                        <p className="text-xs text-emerald-400 mt-1">
                                                            Est. Rp {(payload[0].value * tariff).toLocaleString('id-ID')}
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                        cursor={{ fill: '#f1f5f9', opacity: 0.4 }}
                                    />
                                    <Bar
                                        dataKey="usage_kwh"
                                        fill="#10b981"
                                        radius={[4, 4, 0, 0]}
                                        activeBar={{ fill: '#059669' }}
                                    />
                                </BarChart>
                            ) : (
                                /* Daily/Monthly View: Use Area Chart */
                                <AreaChart
                                    data={chartData}
                                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#0066ff" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#0066ff" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0066ff" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#0066ff" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                    <XAxis
                                        dataKey={timeRange === 'month' ? 'month' : 'date'}
                                        tickFormatter={formatXAxis}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                        tickMargin={8}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                        width={40}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="usage_kwh"
                                        stroke="#0066ff"
                                        strokeWidth={2.5}
                                        fill="url(#colorUv)"
                                        activeDot={{ r: 5, strokeWidth: 0, fill: '#0066ff' }}
                                        dot={(props) => {
                                            const { cx, cy, payload } = props;
                                            if (payload.isTopUp) {
                                                return (
                                                    <g key={`dot-${payload.date}`}>
                                                        <circle cx={cx} cy={cy} r={5} fill="#ffffff" stroke="#3b82f6" strokeWidth={2} />
                                                        <circle cx={cx} cy={cy} r={2.5} fill="#3b82f6" />
                                                    </g>
                                                );
                                            }
                                            return <circle cx={cx} cy={cy} r={0} />;
                                        }}
                                    />
                                </AreaChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* RIGHT: Token Balance History (40% width = 2/5) */}
                {balanceData.length > 0 && (
                    <div className="lg:col-span-2 border-l-0 lg:border-l border-gray-100 dark:border-gray-800 lg:pl-6">
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
                )}
            </div>

            {/* BOTTOM SECTION: Monthly History Bar Chart */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                    <div>
                        <h3 className="text-base font-bold text-text-main dark:text-white">{t('dashboard.monthlyHistory')}</h3>
                        <p className="text-sm text-text-sub">{t('dashboard.last30Days')}</p>
                    </div>
                </div>

                <div className="w-full h-[160px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sortedMonthlyData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                            <XAxis
                                dataKey="month"
                                tickFormatter={formatMonthXAxis}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 11 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 11 }}
                                width={40}
                            />
                            <Tooltip content={<MonthlyTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.4 }} />
                            <Bar
                                dataKey="usage_kwh"
                                fill="#07883b"
                                radius={[4, 4, 0, 0]}
                                activeBar={{ fill: '#05602a' }}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default MainUsageChart;

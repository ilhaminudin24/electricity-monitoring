import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { format } from 'date-fns';
import { id as idLocale, enUS } from 'date-fns/locale';
import { formatNumber, formatCurrency, getCurrentLocale } from '../../utils/localeFormatter';
import { getSettings } from '../../utils/settings';

const DailyChart = ({ data }) => {
  const { t } = useTranslation();
  const locale = getCurrentLocale();
  const dateLocale = locale === 'id-ID' ? idLocale : enUS;
  const settings = getSettings();
  const tariffRate = settings.tariffPerKwh || 1444.70;

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-gray-500">
        <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p>{t('chart.noDataAvailable')}</p>
      </div>
    );
  }

  // Format data for chart with cost calculation
  const chartData = data
    .filter((item) => item.usage_kwh > 0)
    .map((item) => {
      const dateObj = new Date(item.date);
      return {
        date: item.date,
        usage: parseFloat(item.usage_kwh.toFixed(2)),
        cost: parseFloat((item.usage_kwh * tariffRate).toFixed(2)),
        formattedDate: format(dateObj, 'dd MMM', { locale: dateLocale }),
        fullDate: format(dateObj, 'dd MMMM yyyy', { locale: dateLocale }),
      };
    })
    .reverse() // Show chronologically
    .slice(-30); // Show last 30 days

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{data.fullDate}</p>
          <p className="text-sm text-blue-600">
            {t('chart.usage')}: <span className="font-bold">{formatNumber(data.usage, 1)} {t('units.kwh')}</span>
          </p>
          <p className="text-sm text-green-600">
            {t('chart.cost')}: <span className="font-bold">{formatCurrency(data.cost)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate bar size based on data length
  const barSize = chartData.length > 15 ? 12 : chartData.length > 7 ? 20 : 30;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart 
        data={chartData}
        margin={{ top: 10, right: 10, left: 0, bottom: 60 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="formattedDate"
          angle={-45}
          textAnchor="end"
          height={80}
          tick={{ fontSize: 12, fill: '#6b7280' }}
          interval={chartData.length > 15 ? 1 : 0}
        />
        <YAxis 
          tick={{ fontSize: 12, fill: '#6b7280' }}
          label={{ 
            value: t('units.kwh'), 
            angle: -90, 
            position: 'insideLeft',
            style: { fontSize: 12, fill: '#6b7280' }
          }} 
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
        <Bar 
          dataKey="usage" 
          fill="#3B82F6"
          radius={[4, 4, 0, 0]}
          maxBarSize={barSize}
        >
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.usage > (chartData.reduce((sum, d) => sum + d.usage, 0) / chartData.length) ? '#3B82F6' : '#93C5FD'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default DailyChart;


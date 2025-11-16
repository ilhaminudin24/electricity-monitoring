import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parse } from 'date-fns';

const MonthlyChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        No data available
      </div>
    );
  }

  // Format data for chart
  const chartData = data
    .filter((item) => item.usage_kwh > 0)
    .map((item) => {
      const monthDate = parse(item.month, 'yyyy-MM', new Date());
      return {
        month: item.month,
        usage: parseFloat(item.usage_kwh.toFixed(2)),
        label: format(monthDate, 'MMM yyyy'),
      };
    })
    .slice(-12); // Show last 12 months

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          angle={-45}
          textAnchor="end"
          height={80}
          interval="preserveStartEnd"
        />
        <YAxis label={{ value: 'kWh', angle: -90, position: 'insideLeft' }} />
        <Tooltip
          formatter={(value) => [`${value} kWh`, 'Usage']}
          labelFormatter={(label) => `Month: ${label}`}
        />
        <Bar dataKey="usage" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default MonthlyChart;


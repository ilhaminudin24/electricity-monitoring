import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

const DailyChart = ({ data }) => {
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
    .map((item) => ({
      date: item.date,
      usage: parseFloat(item.usage_kwh.toFixed(2)),
      formattedDate: format(new Date(item.date), 'MMM dd'),
    }))
    .slice(-30); // Show last 30 days

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="formattedDate"
          angle={-45}
          textAnchor="end"
          height={80}
          interval="preserveStartEnd"
        />
        <YAxis label={{ value: 'kWh', angle: -90, position: 'insideLeft' }} />
        <Tooltip
          formatter={(value) => [`${value} kWh`, 'Usage']}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Line
          type="monotone"
          dataKey="usage"
          stroke="#3B82F6"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default DailyChart;


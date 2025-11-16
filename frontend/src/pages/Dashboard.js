import React, { useState, useEffect } from 'react';
import { getAllReadings } from '../services/firestoreService';
import { calculateDailyUsage, calculateWeeklyUsage, calculateMonthlyUsage, calculateTokenPrediction } from '../utils/analytics';
import StatCard from '../components/StatCard';
import DailyChart from '../components/charts/DailyChart';
import WeeklyChart from '../components/charts/WeeklyChart';
import MonthlyChart from '../components/charts/MonthlyChart';
import { formatRupiah } from '../utils/rupiah';
import { formatDateTimeLocal } from '../utils/date';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    monthlyUsage: 0,
    dailyAverage: 0,
    tokenPrediction: null,
    lastInput: null,
  });
  const [dailyData, setDailyData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all readings from Firestore
      const readings = await getAllReadings();
      
      // Get latest reading
      const latest = readings.length > 0 ? readings[0] : null;
      
      // Calculate analytics from readings
      const dailyUsage = calculateDailyUsage(readings, 30);
      const weeklyUsage = calculateWeeklyUsage(readings, 12);
      const monthlyUsage = calculateMonthlyUsage(readings, 12);
      const prediction = calculateTokenPrediction(readings);
      
      // Calculate monthly usage (current month)
      const currentMonth = new Date().toISOString().slice(0, 7);
      const currentMonthData = monthlyUsage.find((m) => m.month === currentMonth);
      const monthlyUsageValue = currentMonthData?.usage_kwh || 0;

      // Calculate daily average from last 30 days
      const validDailyUsage = dailyUsage
        .filter((d) => d.usage_kwh > 0)
        .map((d) => d.usage_kwh);
      const dailyAverage = validDailyUsage.length > 0
        ? validDailyUsage.reduce((a, b) => a + b, 0) / validDailyUsage.length
        : 0;

      setStats({
        monthlyUsage: parseFloat(monthlyUsageValue.toFixed(2)),
        dailyAverage: parseFloat(dailyAverage.toFixed(2)),
        lastInput: latest,
      });

      setDailyData(dailyUsage);
      setWeeklyData(weeklyUsage);
      setMonthlyData(monthlyUsage);
      setPrediction(prediction);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-1">Monitor your electricity consumption</p>
      </div>

      {/* Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Monthly Usage"
          value={`${stats.monthlyUsage} kWh`}
          subtitle="Current month"
          icon="📊"
          color="blue"
        />
        <StatCard
          title="Daily Average"
          value={`${stats.dailyAverage} kWh`}
          subtitle="Last 30 days"
          icon="📈"
          color="green"
        />
        <StatCard
          title="Token Prediction"
          value={
            prediction?.hasToken
              ? prediction.daysUntilDepletion
                ? `${prediction.daysUntilDepletion} days`
                : 'N/A'
              : 'No token data'
          }
          subtitle={
            prediction?.hasToken && prediction.predictedDepletionDate
              ? `Until ${new Date(prediction.predictedDepletionDate).toLocaleDateString()}`
              : 'Add token info'
          }
          icon="🔮"
          color="yellow"
        />
        <StatCard
          title="Last Input"
          value={stats.lastInput ? `${stats.lastInput.reading_kwh} kWh` : 'No data'}
          subtitle={stats.lastInput ? formatDateTimeLocal(stats.lastInput.created_at) : ''}
          icon="📝"
          color="purple"
        />
      </div>

      {/* Cost Estimation Card */}
      {prediction?.hasToken && prediction.estimatedMonthlyCost && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Cost Estimation</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Cost per kWh</p>
              <p className="text-xl font-bold text-gray-900">
                {prediction.costPerKwh ? formatRupiah(prediction.costPerKwh) : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Current Month Usage</p>
              <p className="text-xl font-bold text-gray-900">
                {prediction.currentMonthUsage} kWh
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Estimated Monthly Cost</p>
              <p className="text-xl font-bold text-green-600">
                {formatRupiah(prediction.estimatedMonthlyCost)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Usage</h3>
          <DailyChart data={dailyData} />
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Usage</h3>
          <WeeklyChart data={weeklyData} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Usage</h3>
        <MonthlyChart data={monthlyData} />
      </div>
    </div>
  );
};

export default Dashboard;


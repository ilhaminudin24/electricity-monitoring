import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getAllReadings } from '../services/firestoreService';
import { calculateDailyUsage, calculateWeeklyUsage, calculateMonthlyUsage, calculateTokenPrediction } from '../utils/analytics';
import StatCard from '../components/StatCard';
import DailyChart from '../components/charts/DailyChart';
import WeeklyChart from '../components/charts/WeeklyChart';
import MonthlyChart from '../components/charts/MonthlyChart';
import { formatCurrency, formatNumber } from '../utils/localeFormatter';
import { getSettings } from '../utils/settings';

const Dashboard = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30days'); // 'today', '7days', '30days', 'thisMonth'
  const [stats, setStats] = useState({
    totalUsage: 0,
    totalCost: 0,
    highestUsageDay: { date: null, usage: 0 },
    averageDailyUsage: 0,
    monthlyUsage: 0,
    dailyAverage: 0,
    tokenPrediction: null,
    lastInput: null,
  });
  const [dailyData, setDailyData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [filteredDailyData, setFilteredDailyData] = useState([]);

  const loadDashboardData = useCallback(async () => {
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

      // Don't set stats here - let filterDataByRange() handle it
      // Just set the base values that won't be overwritten
      setStats(prev => ({
        ...prev,
        monthlyUsage: parseFloat(monthlyUsageValue.toFixed(2)),
        dailyAverage: parseFloat(dailyAverage.toFixed(2)),
        lastInput: latest,
      }));

      setDailyData(dailyUsage);
      setWeeklyData(weeklyUsage);
      setMonthlyData(monthlyUsage);
      setPrediction(prediction);
      
      // Add console logging for debugging
      console.log('📊 Dashboard Debug:');
      console.log('Total readings:', readings.length);
      console.log('Daily usage data:', dailyUsage);
      console.log('Weekly usage data:', weeklyUsage);
      console.log('Monthly usage data:', monthlyUsage);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const filterDataByRange = useCallback(() => {
    if (!dailyData || dailyData.length === 0) {
      console.log('⚠️ No daily data to filter');
      setFilteredDailyData([]);
      return;
    }

    let filtered = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (dateRange === 'today') {
      // Filter for today only - compare actual dates
      const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
      filtered = dailyData.filter(d => d.date === todayStr);
      
      // If no data for today, show the most recent day's data instead of 0s
      if (filtered.length === 0 && dailyData.length > 0) {
        filtered = [dailyData[0]]; // Take the most recent day
        console.log(`🔍 No data for TODAY (${todayStr}), showing latest available:`, filtered);
      } else {
        console.log(`🔍 Filtering for TODAY (${todayStr}):`, filtered);
      }
    } else if (dateRange === 'thisMonth') {
      // Filter for current month
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthStartStr = monthStart.toISOString().split('T')[0];
      filtered = dailyData.filter(d => d.date >= monthStartStr);
      console.log(`🔍 Filtering for THIS MONTH (from ${monthStartStr}):`, filtered);
    } else {
      // For 7days and 30days - take first N items (already sorted newest first)
      const days = dateRange === '7days' ? 7 : 30;
      filtered = dailyData.slice(0, days);
      console.log(`🔍 Filtering for ${dateRange} (${days} days):`, filtered);
    }

    setFilteredDailyData(filtered);

    // Calculate stats for filtered data
    const validUsage = filtered.filter(d => d.usage_kwh > 0);
    console.log('Valid usage entries:', validUsage);
    
    const totalUsage = validUsage.reduce((sum, d) => sum + d.usage_kwh, 0);
    console.log('Total usage calculated:', totalUsage);
    
    // Calculate total cost based on settings tariff
    const settings = getSettings();
    const tariffRate = settings.tariffPerKwh || 1444.70;
    const totalCost = totalUsage * tariffRate;

    // Find highest usage day
    const highestDay = validUsage.reduce((max, d) => 
      d.usage_kwh > max.usage ? { date: d.date, usage: d.usage_kwh } : max,
      { date: null, usage: 0 }
    );

    // Calculate average
    const averageUsage = validUsage.length > 0 ? totalUsage / validUsage.length : 0;

    console.log('Setting stats:', {
      totalUsage: parseFloat(totalUsage.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      highestUsageDay: highestDay,
      averageDailyUsage: parseFloat(averageUsage.toFixed(2)),
    });

    setStats(prev => ({
      ...prev,
      totalUsage: parseFloat(totalUsage.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      highestUsageDay: highestDay,
      averageDailyUsage: parseFloat(averageUsage.toFixed(2)),
    }));
  }, [dailyData, dateRange]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    // Filter data based on date range
    filterDataByRange();
  }, [dateRange, dailyData, filterDataByRange]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 animate-pulse">
        <div className="text-gray-500">{t('dashboard.loadingDashboard')}</div>
      </div>
    );
  }

  const DateRangeSelector = () => (
    <div className="flex flex-wrap gap-2 mb-6">
      <button
        onClick={() => setDateRange('today')}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          dateRange === 'today'
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
        }`}
      >
        {t('time.today')}
      </button>
      <button
        onClick={() => setDateRange('7days')}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          dateRange === '7days'
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
        }`}
      >
        7 {t('dashboard.days')}
      </button>
      <button
        onClick={() => setDateRange('30days')}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          dateRange === '30days'
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
        }`}
      >
        30 {t('dashboard.days')}
      </button>
      <button
        onClick={() => setDateRange('thisMonth')}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          dateRange === 'thisMonth'
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
        }`}
      >
        {t('time.thisMonth')}
      </button>
    </div>
  );


  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h2>
        <p className="text-gray-600 mt-1">{t('dashboard.subtitle')}</p>
      </div>

      {/* Date Range Selector */}
      <DateRangeSelector />

      {/* Summary Cards - 2x2 on mobile, 4x1 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          title={t('dashboard.totalUsage')}
          value={formatNumber(stats.totalUsage, 1)}
          unit={t('units.kwh')}
          subtitle={
            dateRange === 'today' ? (filteredDailyData.length > 0 && filteredDailyData[0]?.date === new Date().toISOString().split('T')[0] 
              ? t('time.today') 
              : `${t('time.latest')}: ${filteredDailyData.length > 0 ? new Date(filteredDailyData[0]?.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : ''}`) :
            dateRange === '7days' ? `7 ${t('dashboard.days')}` :
            dateRange === '30days' ? `30 ${t('dashboard.days')}` :
            t('time.thisMonth')
          }
          icon="⚡"
          color="blue"
        />
        <StatCard
          title={t('dashboard.totalCost')}
          value={formatCurrency(stats.totalCost, false)}
          unit=""
          subtitle="Rp"
          icon="💰"
          color="green"
        />
        <StatCard
          title={t('dashboard.highestUsage')}
          value={formatNumber(stats.highestUsageDay.usage, 1)}
          unit={t('units.kwh')}
          subtitle={stats.highestUsageDay.date ? new Date(stats.highestUsageDay.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
          icon="📈"
          color="yellow"
        />
        <StatCard
          title={t('dashboard.dailyAverage')}
          value={formatNumber(stats.averageDailyUsage, 1)}
          unit={t('units.kwh')}
          subtitle={t('dashboard.perDay')}
          icon="📊"
          color="purple"
        />
      </div>

      {/* Cost Estimation Card */}
      {prediction?.hasToken && prediction.estimatedMonthlyCost && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 border border-blue-100 animate-slideIn">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">💰</span>
            {t('dashboard.costEstimation')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">{t('dashboard.costPerKwh')}</p>
              <p className="text-xl font-bold text-gray-900">
                {prediction.costPerKwh ? formatCurrency(prediction.costPerKwh) : 'N/A'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">{t('dashboard.currentMonthUsage')}</p>
              <p className="text-xl font-bold text-gray-900">
                {formatNumber(prediction.currentMonthUsage, 1)} {t('units.kwh')}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">{t('dashboard.estimatedMonthlyCost')}</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(prediction.estimatedMonthlyCost)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 animate-slideIn">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.dailyUsage')}</h3>
          <DailyChart data={filteredDailyData} />
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 animate-slideIn">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.weeklyUsage')}</h3>
          <WeeklyChart data={weeklyData} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 animate-slideIn">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.monthlyUsageChart')}</h3>
        <MonthlyChart data={monthlyData} />
      </div>
    </div>
  );
};

export default Dashboard;


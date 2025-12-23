
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { getAllReadings } from '../services/supabaseService';
import { ChevronDown, Home, Store, Plus } from 'lucide-react'; // Added icons
import { motion, AnimatePresence } from 'framer-motion'; // Added for dropdown animation
import {
  calculateDailyUsage,
  calculateWeeklyUsage,
  calculateMonthlyUsage,
  calculateTokenPrediction,
  calculateBurnRateProjection,
  calculateEfficiencyScore
} from '../utils/analytics';
import { getSettings } from '../utils/settings';

// New Components
import TotalUsageCard from '../components/dashboard/TotalUsageCard';
import EstCostCard from '../components/dashboard/EstCostCard';
import TokenPredictionCard from '../components/dashboard/TokenPredictionCard';
import MainUsageChart from '../components/dashboard/MainUsageChart';
import TokenBurnRateChart from '../components/dashboard/TokenBurnRateChart';
import TokenBalanceHistoryCard from '../components/dashboard/TokenBalanceHistoryCard';
import EfficiencyScoreCard from '../components/dashboard/EfficiencyScoreCard';
import AlertBox from '../components/dashboard/AlertBox';
import RecentReadingsList from '../components/dashboard/RecentReadingsList';
import GlobalFilterBar from '../components/dashboard/GlobalFilterBar';
import FeatureTeaserModal from '../components/FeatureTeaserModal';
import ProUpgradeCard from '../components/ProUpgradeCard'; // Import Upsell Modal

const Dashboard = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);

  // Upsell State
  const [isMeterDropdownOpen, setIsMeterDropdownOpen] = useState(false);
  const [teaserFeature, setTeaserFeature] = useState(null);

  // Data States
  const [dailyData, setDailyData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [readings, setReadings] = useState([]);

  // Derived Stats
  const [totalUsage30Days, setTotalUsage30Days] = useState(0);
  const [usageTrend, setUsageTrend] = useState(0);
  const [sparklineData, setSparklineData] = useState([]);

  const [prediction, setPrediction] = useState({
    estimatedMonthlyCost: 0,
    dailyAverageCost: 0,
    daysUntilDepletion: null,
    hasToken: false
  });

  // Burn Rate Projection data
  const [burnRateData, setBurnRateData] = useState(null);

  // Efficiency Score data
  const [efficiencyScore, setEfficiencyScore] = useState(null);

  // Filter State
  const [usageFilter, setUsageFilter] = useState('week'); // 'day', 'week', 'month'
  const [filteredUsage, setFilteredUsage] = useState({
    total: 0,
    trend: 0,
    chartData: [],
    estimatedCost: 0,
    dailyAvgCost: 0
  });

  const loadDashboardData = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      // Fetch raw readings
      const fetchedReadings = await getAllReadings(currentUser.id, 1000);
      setReadings(fetchedReadings);

      if (!fetchedReadings || fetchedReadings.length === 0) {
        setLoading(false);
        return;
      }

      // 1. Process Timeseries Data
      const daily = calculateDailyUsage(fetchedReadings, 60); // INCREASED to 60 for trend comparison
      const weekly = calculateWeeklyUsage(fetchedReadings, 12);
      const monthly = calculateMonthlyUsage(fetchedReadings, 12);

      setDailyData(daily);
      setWeeklyData(weekly);
      setMonthlyData(monthly);

      // 2. Calculate Total Usage (Last 30 Days)
      const total30 = daily.reduce((acc, curr) => acc + curr.usage_kwh, 0);
      setTotalUsage30Days(parseFloat(total30.toFixed(1)));

      // 3. Calculate Trend (Last 7 Days vs Previous 7 Days)
      // daily array is usually sorted [newest, ..., oldest] or [oldest, ..., newest]?
      // analytics.js `calculateDailyUsage` usually returns sorted by date ascending or descending?
      // Recharts prefers date ascending. Let's assume `calculateDailyUsage` returns correct order for chart.
      // If it returns [{date: '2023-01-01', ...}, {date: '2023-01-02', ...}] (Ascending)
      // Then last 7 days are at the end.

      // Let's verify sort order from usage. Usually charts need Ascending. 
      // Assuming Ascending:
      const sortedDaily = [...daily].sort((a, b) => new Date(a.date) - new Date(b.date));

      const last7 = sortedDaily.slice(-7);
      const prev7 = sortedDaily.slice(-14, -7);

      const sumLast7 = last7.reduce((acc, curr) => acc + curr.usage_kwh, 0);
      const sumPrev7 = prev7.reduce((acc, curr) => acc + curr.usage_kwh, 0);

      let trend = 0;
      if (sumPrev7 > 0) {
        trend = ((sumLast7 - sumPrev7) / sumPrev7) * 100;
      }
      setUsageTrend(Math.round(trend));

      // Sparkline data (simple value array for last 7 days)
      setSparklineData(last7.map(d => ({ value: d.usage_kwh })));

      // 4. Token & Cost Predictions
      const tokenPred = calculateTokenPrediction(fetchedReadings);

      // 5. Calculate Burn Rate Projection for new chart
      const burnRate = calculateBurnRateProjection(fetchedReadings);
      setBurnRateData(burnRate);

      // Estimate Cost - get settings first
      const settings = getSettings();
      const tariff = settings.tariffPerKwh || 1444.70;

      // 6. Calculate Efficiency Score (uses settings)
      const effScore = calculateEfficiencyScore(fetchedReadings, settings);
      setEfficiencyScore(effScore);

      // Daily Average Cost
      // Use daily average usage from token prediction or calculate manually
      const avgUsage = tokenPred.avgDailyUsage || 0;
      const dailyAvgCost = avgUsage * tariff;
      const estimatedMonthly = avgUsage * 30 * tariff;

      setPrediction({
        estimatedMonthlyCost: tokenPred.estimatedMonthlyCost || 0,
        dailyAverageCost: dailyAvgCost,
        daysUntilDepletion: tokenPred.daysUntilDepletion,
        hasToken: tokenPred.hasToken,
        remainingKwh: tokenPred.remainingKwh
      });

    } catch (error) {
      console.error("Dashboard data load error:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Calculate Filtered Usage Effect
  useEffect(() => {
    if (!dailyData || dailyData.length === 0) return;

    // Sorting by date ascending for charts
    const sortedDaily = [...dailyData].sort((a, b) => new Date(a.date) - new Date(b.date));

    let total = 0;
    let trend = 0;
    let chartData = [];

    // Helper to sum usage
    const sumUsage = (data) => data.reduce((acc, curr) => acc + curr.usage_kwh, 0);

    // Format date helper
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
    };

    if (usageFilter === 'day') {
      // Daily view: Show last 7 days for more meaningful data
      const last7 = sortedDaily.slice(-7);
      const prev7 = sortedDaily.slice(-14, -7);

      total = sumUsage(last7);

      // Trend vs Previous 7 Days
      const sumPrev7 = sumUsage(prev7);
      if (sumPrev7 > 0) {
        trend = ((total - sumPrev7) / sumPrev7) * 100;
      }

      chartData = last7.map(d => ({
        name: formatDate(d.date),
        value: parseFloat(d.usage_kwh.toFixed(2)),
        isTopUp: d.isTopUp
      }));

    } else if (usageFilter === 'week') {
      // Weekly view: Show last 4 weeks aggregated by week
      // weeklyData is already sorted newest first from aggregateWeekly
      const last4Weeks = weeklyData.slice(0, 4).reverse(); // Reverse for chart (oldest to newest)

      total = last4Weeks.reduce((acc, w) => acc + w.usage_kwh, 0);

      // Trend: This week vs last week
      const thisWeek = weeklyData[0]?.usage_kwh || 0;
      const lastWeek = weeklyData[1]?.usage_kwh || 0;
      if (lastWeek > 0) {
        trend = ((thisWeek - lastWeek) / lastWeek) * 100;
      }

      // Format week label helper
      const formatWeekLabel = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const startDay = start.getDate();
        const endDay = end.getDate();
        const month = start.toLocaleDateString('en-US', { month: 'short' });
        return `${month} ${startDay}-${endDay}`;
      };

      chartData = last4Weeks.map(w => ({
        name: formatWeekLabel(w.startDate, w.endDate),
        value: parseFloat(w.usage_kwh.toFixed(2)),
        isTopUp: false
      }));

    } else if (usageFilter === 'month') {
      // Monthly view: Show last 6 months aggregated by month
      // monthlyData is already sorted newest first from aggregateMonthly
      const last6Months = monthlyData.slice(0, 6).reverse(); // Reverse for chart (oldest to newest)

      total = last6Months.reduce((acc, m) => acc + m.usage_kwh, 0);

      // Trend: This month vs last month
      const thisMonth = monthlyData[0]?.usage_kwh || 0;
      const lastMonth = monthlyData[1]?.usage_kwh || 0;
      if (lastMonth > 0) {
        trend = ((thisMonth - lastMonth) / lastMonth) * 100;
      }

      chartData = last6Months.map(m => ({
        name: m.monthName || m.month,
        value: parseFloat(m.usage_kwh.toFixed(2)),
        isTopUp: false
      }));
    }

    // Calculate estimated cost based on filter
    const settings = getSettings();
    const tariff = settings.tariffPerKwh || 1444.70;
    const filteredCost = total * tariff;

    // Calculate average for the period
    let numPeriods = 1;
    if (usageFilter === 'day') numPeriods = 7;      // 7 days
    else if (usageFilter === 'week') numPeriods = 4; // 4 weeks
    else if (usageFilter === 'month') numPeriods = 6; // 6 months

    const avgUsage = numPeriods > 0 ? total / numPeriods : 0;
    const avgCost = avgUsage * tariff;

    setFilteredUsage({
      total: parseFloat(total.toFixed(2)),
      trend: Math.round(trend),
      chartData,
      estimatedCost: parseFloat(filteredCost.toFixed(2)),
      dailyAvgCost: parseFloat(avgCost.toFixed(2))
    });

  }, [dailyData, weeklyData, monthlyData, usageFilter]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <FeatureTeaserModal
        isOpen={!!teaserFeature}
        onClose={() => setTeaserFeature(null)}
        featureId={teaserFeature}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {/* Meter Switcher - Discovery Point A */}
          <div className="relative inline-block">
            <button
              onClick={() => setIsMeterDropdownOpen(!isMeterDropdownOpen)}
              className="flex items-center gap-2 group focus:outline-none"
            >
              <h2 className="text-2xl font-bold text-text-main dark:text-white group-hover:text-primary transition-colors">{t('dashboard.title')}</h2>
              <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full flex items-center gap-2 border border-transparent group-hover:border-primary/20 group-hover:bg-primary/5 transition-all">
                <Home className="w-3 h-3 text-primary" />
                <span className="text-xs font-bold text-text-main dark:text-white">Home (Current)</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </div>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isMeterDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsMeterDropdownOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-20 overflow-hidden"
                  >
                    <div className="p-2">
                      <div className="px-3 py-2 bg-primary/5 rounded-lg flex items-center gap-3 mb-1">
                        <Home className="w-4 h-4 text-primary" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-text-main">My Home</p>
                          <p className="text-xs text-text-sub">Current Meter</p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setIsMeterDropdownOpen(false);
                          setTeaserFeature('MULTI_METER');
                        }}
                        className="w-full px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center gap-3 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                          <Plus className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-text-main">Add Property</p>
                          <p className="text-xs text-blue-500 font-semibold">Pro Feature</p>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <p className="text-text-sub text-sm mt-1">{t('dashboard.welcomeBack')}, {currentUser?.displayName || 'User'}</p>
        </div>

        <div className="flex items-center gap-4">
          <GlobalFilterBar
            currentFilter={usageFilter}
            onFilterChange={setUsageFilter}
          />
          <div className="text-right hidden md:block">
            <p className="text-xs text-text-sub font-semibold bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>


      {/* Main Grid: Left Content (2/3) & Right Sidebar (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Row 1: Usage & Cost */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-full">
              <TotalUsageCard
                totalKwh={filteredUsage.total}
                trendPercentage={filteredUsage.trend}
                chartData={filteredUsage.chartData}
                timeRange={usageFilter}
              />
            </div>
            <div className="h-full">
              <EstCostCard
                estimatedCost={filteredUsage.estimatedCost}
                dailyAverageCost={filteredUsage.dailyAvgCost}
                timeRange={usageFilter}
              />
            </div>
          </div>

          {/* Row 2: Prediction */}
          <TokenPredictionCard
            daysRemaining={prediction.daysUntilDepletion}
            hasToken={prediction.hasToken}
            remainingKwh={prediction.remainingKwh}
          />

          {/* Row 3: Burn Rate */}
          <div className="bg-white dark:bg-background-dark rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 p-6">
            <TokenBurnRateChart
              projectionData={burnRateData?.projectionData || []}
              remainingKwh={burnRateData?.remainingKwh || 0}
              daysRemaining={burnRateData?.daysUntilDepletion}
              depletionDate={burnRateData?.predictedDepletionDate}
              avgDailyUsage={burnRateData?.avgDailyUsage || 0}
              criticalKwh={burnRateData?.criticalKwh || 0}
              warningKwh={burnRateData?.warningKwh || 0}
              hasData={burnRateData?.hasData || false}
            />
          </div>

          {/* Row 4: History */}
          <TokenBalanceHistoryCard dailyData={dailyData} />
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="flex flex-col gap-6">
          {/* 1. Pro Upgrade (Prime Spot) */}
          <ProUpgradeCard onClick={() => setTeaserFeature('PRO_UPGRADE')} />

          {/* 2. Efficiency Score */}
          <EfficiencyScoreCard
            score={efficiencyScore}
            hasData={efficiencyScore?.hasData || false}
            message={efficiencyScore?.message || ''}
          />

          {/* 3. Alerts */}
          <AlertBox dailyUsage={dailyData} />

          {/* 4. Recent Readings */}
          <RecentReadingsList readings={readings} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

/**
 * Analytics utilities using new energy calculation logic
 * Delegates to energy utilities for correct consumption calculation
 */

import { computeDailyUsage } from './energy/computeDailyUsage';
import { aggregateWeekly } from './energy/aggregateWeekly';
import { aggregateMonthly } from './energy/aggregateMonthly';

/**
 * Calculate daily usage from readings
 * Uses new energy calculation logic that handles meter readings as remaining kWh
 * @param {Array} readings - Array of reading objects
 * @param {number} days - Number of days to analyze
 * @returns {Array} Daily usage data
 */
export const calculateDailyUsage = (readings, days = 30) => {
  if (!readings || readings.length === 0) return [];

  console.log('📊 calculateDailyUsage called with:', readings.length, 'readings');

  // Use new computation logic
  const dailyUsage = computeDailyUsage(readings);

  // Filter to requested number of days
  const result = dailyUsage.slice(0, days);

  console.log('Daily usage result:', result);
  return result;
};

/**
 * Calculate weekly usage from readings
 * @param {Array} readings - Array of reading objects
 * @param {number} weeks - Number of weeks to analyze
 * @returns {Array} Weekly usage data
 */
export const calculateWeeklyUsage = (readings, weeks = 12) => {
  if (!readings || readings.length === 0) return [];

  console.log('📅 calculateWeeklyUsage called with:', readings.length, 'readings');

  // First compute daily usage
  const dailyUsage = computeDailyUsage(readings);

  // Then aggregate to weekly
  const weeklyUsage = aggregateWeekly(dailyUsage, weeks);

  console.log('Weekly usage result:', weeklyUsage);
  return weeklyUsage;
};

/**
 * Calculate monthly usage from readings
 * @param {Array} readings - Array of reading objects
 * @param {number} months - Number of months to analyze
 * @returns {Array} Monthly usage data
 */
export const calculateMonthlyUsage = (readings, months = 12) => {
  if (!readings || readings.length === 0) return [];

  console.log('📆 calculateMonthlyUsage called with:', readings.length, 'readings');

  // First compute daily usage
  const dailyUsage = computeDailyUsage(readings);

  // Then aggregate to monthly
  const monthlyUsage = aggregateMonthly(dailyUsage, months);

  console.log('Monthly usage result:', monthlyUsage);
  return monthlyUsage;
};

/**
 * Calculate token prediction
 * @param {Array} readings - Array of reading objects
 * @returns {Object} Prediction data
 */
export const calculateTokenPrediction = (readings) => {
  if (!readings || readings.length === 0) {
    return {
      hasToken: false,
      message: 'No readings available',
    };
  }

  // Get latest reading with token info
  // Support both Supabase (date) and legacy (created_at) field names
  const latestWithToken = [...readings]
    .filter((r) => r.token_amount && r.token_amount > 0)
    .sort((a, b) => {
      const dateA = (a.date || a.created_at) instanceof Date
        ? (a.date || a.created_at)
        : new Date(a.date || a.created_at);
      const dateB = (b.date || b.created_at) instanceof Date
        ? (b.date || b.created_at)
        : new Date(b.date || b.created_at);
      return dateB - dateA;
    })[0];

  if (!latestWithToken) {
    return {
      hasToken: false,
      message: 'No token information available',
    };
  }

  // Calculate daily average from last 30 days using new logic
  const dailyUsage = calculateDailyUsage(readings, 30);
  const validDailyUsage = dailyUsage.filter((d) => d.usage_kwh > 0).map((d) => d.usage_kwh);
  const avgDailyUsage = validDailyUsage.length > 0
    ? validDailyUsage.reduce((a, b) => a + b, 0) / validDailyUsage.length
    : 0;

  // Fix: Use the latest reading value as remaining Kwh, NOT the token amount from topup transaction
  const sortedReadings = [...readings].sort((a, b) => {
    const dateA = new Date(a.date || a.created_at);
    const dateB = new Date(b.date || b.created_at);
    return dateB - dateA;
  });
  const latestReading = sortedReadings[0];
  const remainingKwh = latestReading ? (latestReading.kwh_value || latestReading.reading_kwh) : 0;

  const daysUntilDepletion = avgDailyUsage > 0 ? Math.ceil(remainingKwh / avgDailyUsage) : null;
  const predictedDate = daysUntilDepletion
    ? new Date(Date.now() + daysUntilDepletion * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    : null;

  // Calculate cost per kWh
  const costPerKwh = latestWithToken.token_cost && latestWithToken.token_amount
    ? latestWithToken.token_cost / latestWithToken.token_amount
    : null;

  // Calculate current month usage
  const monthlyUsage = calculateMonthlyUsage(readings, 12);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthData = monthlyUsage.find((m) => m.month === currentMonth);
  const monthlyUsageValue = currentMonthData?.usage_kwh || 0;
  const estimatedMonthlyCost = costPerKwh ? monthlyUsageValue * costPerKwh : null;

  return {
    hasToken: true,
    currentToken: remainingKwh, // Use corrected remaining value
    tokenCost: latestWithToken.token_cost,
    remainingKwh: remainingKwh,
    avgDailyUsage: parseFloat(avgDailyUsage.toFixed(2)),
    daysUntilDepletion: daysUntilDepletion,
    predictedDepletionDate: predictedDate,
    costPerKwh: costPerKwh ? parseFloat(costPerKwh.toFixed(4)) : null,
    currentMonthUsage: parseFloat(monthlyUsageValue.toFixed(2)),
    estimatedMonthlyCost: estimatedMonthlyCost ? parseFloat(estimatedMonthlyCost.toFixed(2)) : null,
  };
};

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



  // Use new computation logic
  const dailyUsage = computeDailyUsage(readings);

  // Filter to requested number of days
  const result = dailyUsage.slice(0, days);


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



  // First compute daily usage
  const dailyUsage = computeDailyUsage(readings);

  // Then aggregate to weekly
  const weeklyUsage = aggregateWeekly(dailyUsage, weeks);


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



  // First compute daily usage
  const dailyUsage = computeDailyUsage(readings);

  // Then aggregate to monthly
  const monthlyUsage = aggregateMonthly(dailyUsage, months);


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

/**
 * Calculate burn rate projection data for chart visualization
 * Generates data points showing projected token depletion over time
 * @param {Array} readings - Array of reading objects
 * @returns {Object} Burn rate projection data including projection points
 */
export const calculateBurnRateProjection = (readings) => {
  if (!readings || readings.length === 0) {
    return {
      hasData: false,
      projectionData: [],
      remainingKwh: 0,
      avgDailyUsage: 0,
      daysUntilDepletion: null,
      predictedDepletionDate: null,
    };
  }

  // Get latest reading for remaining kWh
  const sortedReadings = [...readings].sort((a, b) => {
    const dateA = new Date(a.date || a.created_at);
    const dateB = new Date(b.date || b.created_at);
    return dateB - dateA;
  });
  const latestReading = sortedReadings[0];
  const remainingKwh = latestReading ? (latestReading.kwh_value || latestReading.reading_kwh || 0) : 0;

  // Calculate daily average from last 30 days (always use 30-day average, no filter)
  const dailyUsage = calculateDailyUsage(readings, 30);
  const validDailyUsage = dailyUsage.filter((d) => d.usage_kwh > 0).map((d) => d.usage_kwh);
  const avgDailyUsage = validDailyUsage.length > 0
    ? validDailyUsage.reduce((a, b) => a + b, 0) / validDailyUsage.length
    : 0;

  if (avgDailyUsage <= 0 || remainingKwh <= 0) {
    return {
      hasData: false,
      projectionData: [],
      remainingKwh: remainingKwh,
      avgDailyUsage: 0,
      daysUntilDepletion: null,
      predictedDepletionDate: null,
    };
  }

  // Calculate days until depletion
  const daysUntilDepletion = Math.ceil(remainingKwh / avgDailyUsage);

  // Limit projection to max 60 days for chart readability
  const maxProjectionDays = Math.min(daysUntilDepletion, 60);

  // Generate projection data points
  const projectionData = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i <= maxProjectionDays; i++) {
    const projectedDate = new Date(today);
    projectedDate.setDate(today.getDate() + i);

    const projectedKwh = Math.max(0, remainingKwh - (avgDailyUsage * i));

    projectionData.push({
      date: projectedDate.toISOString().split('T')[0],
      kwhRemaining: parseFloat(projectedKwh.toFixed(2)),
      isActual: i === 0, // Only first point is actual data
      dayIndex: i,
    });
  }

  // Predicted depletion date
  const depletionDate = new Date(today);
  depletionDate.setDate(today.getDate() + daysUntilDepletion);
  const predictedDepletionDate = depletionDate.toISOString().split('T')[0];

  // Calculate warning thresholds (dates when reaching critical/warning zones)
  const criticalDays = 3; // Critical: less than 3 days remaining
  const warningDays = 7;  // Warning: less than 7 days remaining

  const criticalKwh = avgDailyUsage * criticalDays;
  const warningKwh = avgDailyUsage * warningDays;

  // Days until reaching critical/warning zones
  const daysToCritical = remainingKwh > criticalKwh
    ? Math.ceil((remainingKwh - criticalKwh) / avgDailyUsage)
    : 0;
  const daysToWarning = remainingKwh > warningKwh
    ? Math.ceil((remainingKwh - warningKwh) / avgDailyUsage)
    : 0;

  return {
    hasData: true,
    projectionData,
    remainingKwh: parseFloat(remainingKwh.toFixed(2)),
    avgDailyUsage: parseFloat(avgDailyUsage.toFixed(2)),
    daysUntilDepletion,
    predictedDepletionDate,
    criticalKwh: parseFloat(criticalKwh.toFixed(2)),
    warningKwh: parseFloat(warningKwh.toFixed(2)),
    daysToCritical,
    daysToWarning,
    isCritical: daysUntilDepletion <= criticalDays,
    isWarning: daysUntilDepletion <= warningDays && daysUntilDepletion > criticalDays,
  };
};

/**
 * Calculate Efficiency Score (Gamification)
 * Provides a 0-100 score based on 3 components:
 * - Consistency (30 pts): How stable is daily usage?
 * - Budget (40 pts): Is spending on track with budget?
 * - Trend (30 pts): Is usage decreasing week-over-week?
 * 
 * @param {Array} readings - Array of reading objects
 * @param {Object} settings - User settings (monthlyBudget, tariffPerKwh)
 * @returns {Object} Efficiency score data
 */
export const calculateEfficiencyScore = (readings, settings = {}) => {
  // Minimum data requirement
  if (!readings || readings.length < 7) {
    return {
      hasData: false,
      totalScore: null,
      grade: null,
      message: 'Insufficient data (need at least 7 days)',
    };
  }

  // Get daily usage data
  const dailyUsage = computeDailyUsage(readings);

  if (dailyUsage.length < 7) {
    return {
      hasData: false,
      totalScore: null,
      grade: null,
      message: 'Insufficient daily data',
    };
  }

  const result = {
    hasData: true,
    consistencyScore: 0,
    budgetScore: 0,
    trendScore: 0,
    totalScore: 0,
    grade: '',
    breakdown: {},
    tips: [],
  };

  // ===== A. CONSISTENCY SCORE (30 pts) =====
  // Based on Coefficient of Variation (CV) of daily usage
  const last30Days = dailyUsage.slice(0, 30);
  const usageValues = last30Days.filter(d => d.usage_kwh > 0).map(d => d.usage_kwh);

  if (usageValues.length >= 7) {
    const mean = usageValues.reduce((a, b) => a + b, 0) / usageValues.length;
    const variance = usageValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / usageValues.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? (stdDev / mean) * 100 : 0; // Coefficient of Variation

    let consistencyPts = 6;
    if (cv < 15) consistencyPts = 30;
    else if (cv < 25) consistencyPts = 24;
    else if (cv < 40) consistencyPts = 18;
    else if (cv < 60) consistencyPts = 12;

    result.consistencyScore = consistencyPts;
    result.breakdown.consistency = {
      mean: parseFloat(mean.toFixed(2)),
      stdDev: parseFloat(stdDev.toFixed(2)),
      cv: parseFloat(cv.toFixed(1)),
      points: consistencyPts,
      maxPoints: 30,
    };

    // Add tip if score is low
    if (consistencyPts < 18) {
      result.tips.push('consistency');
    }
  }

  // ===== B. BUDGET COMPLIANCE SCORE (40 pts) =====
  // Based on pacing ratio (actual spending pace vs expected pace)
  const budget = settings.monthlyBudget || 500000;
  const tariff = settings.tariffPerKwh || 1444.70;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysElapsed = Math.max(1, Math.ceil((now - startOfMonth) / (1000 * 60 * 60 * 24)));
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthProgress = daysElapsed / daysInMonth;

  // Get this month's usage
  const currentMonthStr = now.toISOString().substring(0, 7); // YYYY-MM
  const thisMonthUsage = last30Days
    .filter(d => d.date && d.date.startsWith(currentMonthStr))
    .reduce((sum, d) => sum + d.usage_kwh, 0);

  const actualCost = thisMonthUsage * tariff;
  const budgetUsedPct = budget > 0 ? (actualCost / budget) : 0;
  const pacingRatio = monthProgress > 0 ? budgetUsedPct / monthProgress : 0;

  let budgetPts = 8;
  if (pacingRatio < 0.8) budgetPts = 40;
  else if (pacingRatio < 1.0) budgetPts = 32;
  else if (pacingRatio < 1.2) budgetPts = 24;
  else if (pacingRatio < 1.5) budgetPts = 16;

  result.budgetScore = budgetPts;
  result.breakdown.budget = {
    monthlyBudget: budget,
    actualCost: parseFloat(actualCost.toFixed(0)),
    budgetUsedPct: parseFloat((budgetUsedPct * 100).toFixed(1)),
    monthProgress: parseFloat((monthProgress * 100).toFixed(1)),
    pacingRatio: parseFloat(pacingRatio.toFixed(2)),
    points: budgetPts,
    maxPoints: 40,
  };

  // Add tip if score is low
  if (budgetPts < 24) {
    result.tips.push('budget');
  }

  // ===== C. TREND SCORE (30 pts) =====
  // Based on week-over-week usage change
  const sortedDaily = [...dailyUsage].sort((a, b) => new Date(b.date) - new Date(a.date));
  const thisWeek = sortedDaily.slice(0, 7).reduce((s, d) => s + d.usage_kwh, 0);
  const lastWeek = sortedDaily.slice(7, 14).reduce((s, d) => s + d.usage_kwh, 0);

  let trendPts = 20; // Default: stable
  let changePct = 0;

  if (lastWeek > 0) {
    changePct = ((thisWeek - lastWeek) / lastWeek) * 100;

    if (changePct < -10) trendPts = 30;      // Significant decrease
    else if (changePct < -5) trendPts = 25;  // Moderate decrease
    else if (changePct <= 5) trendPts = 20;  // Stable
    else if (changePct < 10) trendPts = 12;  // Moderate increase
    else trendPts = 6;                        // Significant increase
  }

  result.trendScore = trendPts;
  result.breakdown.trend = {
    thisWeek: parseFloat(thisWeek.toFixed(2)),
    lastWeek: parseFloat(lastWeek.toFixed(2)),
    changePct: parseFloat(changePct.toFixed(1)),
    points: trendPts,
    maxPoints: 30,
  };

  // Add tip if score is low
  if (trendPts < 20) {
    result.tips.push('trend');
  }

  // ===== TOTAL SCORE & GRADE =====
  result.totalScore = result.consistencyScore + result.budgetScore + result.trendScore;

  // Assign Grade
  if (result.totalScore >= 90) result.grade = 'A+';
  else if (result.totalScore >= 80) result.grade = 'A';
  else if (result.totalScore >= 70) result.grade = 'B';
  else if (result.totalScore >= 60) result.grade = 'C';
  else if (result.totalScore >= 50) result.grade = 'D';
  else result.grade = 'F';

  return result;
};

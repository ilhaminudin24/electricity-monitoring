/**
 * Analytics utilities for Firestore data
 * Calculate daily, weekly, monthly usage from readings array
 */

/**
 * Calculate daily usage from readings
 * @param {Array} readings - Array of reading objects
 * @param {number} days - Number of days to analyze
 * @returns {Array} Daily usage data
 */
export const calculateDailyUsage = (readings, days = 30) => {
  if (!readings || readings.length === 0) return [];

  // Sort by date (oldest first)
  const sorted = [...readings].sort((a, b) => {
    const dateA = a.created_at instanceof Date ? a.created_at : new Date(a.created_at);
    const dateB = b.created_at instanceof Date ? b.created_at : new Date(b.created_at);
    return dateA - dateB;
  });

  // Get date range
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

  // Group by date
  const dailyMap = new Map();

  // Initialize with last reading of each day
  for (let i = 0; i < sorted.length; i++) {
    const reading = sorted[i];
    const date = reading.created_at instanceof Date 
      ? reading.created_at 
      : new Date(reading.created_at);
    
    if (date < startDate) continue;

    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, {
        date: dateKey,
        last_reading: reading.reading_kwh,
        first_reading: reading.reading_kwh,
      });
    } else {
      const existing = dailyMap.get(dateKey);
      existing.last_reading = reading.reading_kwh;
      // Keep first reading of the day
      if (reading.reading_kwh < existing.first_reading) {
        existing.first_reading = reading.reading_kwh;
      }
    }
  }

  // Calculate usage between consecutive days
  const dailyArray = Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      last_reading: data.last_reading,
      first_reading: data.first_reading,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Calculate usage
  const result = dailyArray.map((day, index) => {
    if (index === 0) {
      return {
        date: day.date,
        usage_kwh: 0,
        last_reading: day.last_reading,
      };
    }

    const prevDay = dailyArray[index - 1];
    const usage = day.first_reading - prevDay.last_reading;
    
    return {
      date: day.date,
      usage_kwh: Math.max(0, usage), // Ensure non-negative
      last_reading: day.last_reading,
    };
  });

  return result.reverse(); // Most recent first
};

/**
 * Calculate weekly usage from readings
 * @param {Array} readings - Array of reading objects
 * @param {number} weeks - Number of weeks to analyze
 * @returns {Array} Weekly usage data
 */
export const calculateWeeklyUsage = (readings, weeks = 12) => {
  if (!readings || readings.length === 0) return [];

  const sorted = [...readings].sort((a, b) => {
    const dateA = a.created_at instanceof Date ? a.created_at : new Date(a.created_at);
    const dateB = b.created_at instanceof Date ? b.created_at : new Date(b.created_at);
    return dateA - dateB;
  });

  // Group by week
  const weeklyMap = new Map();

  sorted.forEach((reading) => {
    const date = reading.created_at instanceof Date 
      ? reading.created_at 
      : new Date(reading.created_at);
    
    const year = date.getFullYear();
    const weekNum = getWeekNumber(date);
    const weekKey = `${year}-W${String(weekNum).padStart(2, '0')}`;

    if (!weeklyMap.has(weekKey)) {
      weeklyMap.set(weekKey, {
        week: weekKey,
        readings: [],
        week_start: date,
        week_end: date,
      });
    }

    const weekData = weeklyMap.get(weekKey);
    weekData.readings.push(reading.reading_kwh);
    if (date < weekData.week_start) weekData.week_start = date;
    if (date > weekData.week_end) weekData.week_end = date;
  });

  // Calculate usage per week
  const weeklyArray = Array.from(weeklyMap.entries())
    .map(([week, data]) => ({
      week,
      week_start: data.week_start.toISOString().split('T')[0],
      week_end: data.week_end.toISOString().split('T')[0],
      max_reading: Math.max(...data.readings),
      min_reading: Math.min(...data.readings),
    }))
    .sort((a, b) => a.week.localeCompare(b.week));

  // Calculate usage between consecutive weeks
  const result = weeklyArray.map((week, index) => {
    if (index === 0) {
      return {
        ...week,
        usage_kwh: 0,
      };
    }

    const prevWeek = weeklyArray[index - 1];
    const usage = week.min_reading - prevWeek.max_reading;

    return {
      ...week,
      usage_kwh: Math.max(0, usage),
    };
  });

  return result.reverse();
};

/**
 * Calculate monthly usage from readings
 * @param {Array} readings - Array of reading objects
 * @param {number} months - Number of months to analyze
 * @returns {Array} Monthly usage data
 */
export const calculateMonthlyUsage = (readings, months = 12) => {
  if (!readings || readings.length === 0) return [];

  const sorted = [...readings].sort((a, b) => {
    const dateA = a.created_at instanceof Date ? a.created_at : new Date(a.created_at);
    const dateB = b.created_at instanceof Date ? b.created_at : new Date(b.created_at);
    return dateA - dateB;
  });

  // Group by month
  const monthlyMap = new Map();

  sorted.forEach((reading) => {
    const date = reading.created_at instanceof Date 
      ? reading.created_at 
      : new Date(reading.created_at);
    
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, {
        month: monthKey,
        readings: [],
        month_start: date,
        month_end: date,
      });
    }

    const monthData = monthlyMap.get(monthKey);
    monthData.readings.push(reading.reading_kwh);
    if (date < monthData.month_start) monthData.month_start = date;
    if (date > monthData.month_end) monthData.month_end = date;
  });

  // Calculate usage per month
  const monthlyArray = Array.from(monthlyMap.entries())
    .map(([month, data]) => ({
      month,
      month_start: data.month_start.toISOString().split('T')[0],
      month_end: data.month_end.toISOString().split('T')[0],
      max_reading: Math.max(...data.readings),
      min_reading: Math.min(...data.readings),
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Calculate usage between consecutive months
  const result = monthlyArray.map((month, index) => {
    if (index === 0) {
      return {
        ...month,
        usage_kwh: 0,
      };
    }

    const prevMonth = monthlyArray[index - 1];
    const usage = month.min_reading - prevMonth.max_reading;

    return {
      ...month,
      usage_kwh: Math.max(0, usage),
    };
  });

  return result.reverse();
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
  const latestWithToken = [...readings]
    .filter((r) => r.token_amount && r.token_amount > 0)
    .sort((a, b) => {
      const dateA = a.created_at instanceof Date ? a.created_at : new Date(a.created_at);
      const dateB = b.created_at instanceof Date ? b.created_at : new Date(b.created_at);
      return dateB - dateA;
    })[0];

  if (!latestWithToken) {
    return {
      hasToken: false,
      message: 'No token information available',
    };
  }

  // Calculate daily average from last 30 days
  const dailyUsage = calculateDailyUsage(readings, 30);
  const validDailyUsage = dailyUsage.filter((d) => d.usage_kwh > 0).map((d) => d.usage_kwh);
  const avgDailyUsage = validDailyUsage.length > 0
    ? validDailyUsage.reduce((a, b) => a + b, 0) / validDailyUsage.length
    : 0;

  const remainingKwh = latestWithToken.token_amount;
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
    currentToken: latestWithToken.token_amount,
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
 * Get week number of the year
 */
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}


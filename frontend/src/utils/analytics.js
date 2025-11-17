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

  console.log('📊 calculateDailyUsage called with:', readings.length, 'readings');
  console.log('Raw readings:', readings);

  // Sort by date (oldest first)
  const sorted = [...readings].sort((a, b) => {
    const dateA = a.created_at instanceof Date ? a.created_at : new Date(a.created_at);
    const dateB = b.created_at instanceof Date ? b.created_at : new Date(b.created_at);
    return dateA - dateB;
  });

  console.log('Sorted readings (oldest first):', sorted.map(r => ({
    date: r.created_at,
    reading: r.reading_kwh
  })));

  // Get date range
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

  console.log('Date range:', startDate, 'to', now);

  // Group by date
  const dailyMap = new Map();

  // Initialize with last reading of each day
  for (let i = 0; i < sorted.length; i++) {
    const reading = sorted[i];
    const date = reading.created_at instanceof Date 
      ? reading.created_at 
      : new Date(reading.created_at);
    
    if (date < startDate) {
      console.log('Skipping reading before start date:', date, reading.reading_kwh);
      continue;
    }

    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, {
        date: dateKey,
        last_reading: reading.reading_kwh,
        first_reading: reading.reading_kwh,
        readings: [reading.reading_kwh]
      });
      console.log(`New day ${dateKey}:`, reading.reading_kwh);
    } else {
      const existing = dailyMap.get(dateKey);
      existing.last_reading = reading.reading_kwh;
      existing.readings.push(reading.reading_kwh);
      // Keep first reading of the day
      if (reading.reading_kwh < existing.first_reading) {
        existing.first_reading = reading.reading_kwh;
      }
      console.log(`Updated day ${dateKey}:`, existing);
    }
  }

  console.log('Daily map:', Array.from(dailyMap.entries()));

  // Calculate usage between consecutive days
  const dailyArray = Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      last_reading: data.last_reading,
      first_reading: data.first_reading,
      readings: data.readings
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  console.log('Daily array (sorted):', dailyArray);

  // Calculate usage
  const result = dailyArray.map((day, index) => {
    if (index === 0) {
      // For the first day, check if there are multiple readings
      if (day.readings && day.readings.length > 1) {
        // Calculate usage within the day (last - first)
        const withinDayUsage = day.last_reading - day.first_reading;
        console.log(`Day ${day.date} (first, multiple readings):`, {
          first: day.first_reading,
          last: day.last_reading,
          readings: day.readings,
          usage: withinDayUsage
        });
        return {
          date: day.date,
          usage_kwh: Math.max(0, Math.abs(withinDayUsage)), // Use absolute value to handle decreasing readings
          last_reading: day.last_reading,
        };
      } else {
        // Single reading on first day - no usage can be calculated
        console.log(`Day ${day.date} (first, single reading):`, {
          reading: day.last_reading,
          usage: 0
        });
        return {
          date: day.date,
          usage_kwh: 0,
          last_reading: day.last_reading,
        };
      }
    }

    const prevDay = dailyArray[index - 1];
    // Calculate usage as the absolute difference to handle meter resets
    const rawUsage = day.first_reading - prevDay.last_reading;
    const usage = Math.abs(rawUsage); // Use absolute value
    
    console.log(`Day ${day.date}:`, {
      current_first: day.first_reading,
      prev_last: prevDay.last_reading,
      raw_calculated: rawUsage,
      absolute_usage: usage,
      will_use: usage > 500 ? 0 : usage // Filter out unrealistic values
    });
    
    // Filter out unrealistic usage values (>500 kWh per day suggests meter reset)
    const finalUsage = usage > 500 ? 0 : usage;
    
    return {
      date: day.date,
      usage_kwh: finalUsage,
      last_reading: day.last_reading,
    };
  });

  console.log('Final result (before reverse):', result);
  const reversed = result.reverse(); // Most recent first
  console.log('Final result (after reverse):', reversed);
  
  return reversed;
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

  console.log('Weekly map entries:', Array.from(weeklyMap.keys()));

  // Calculate usage per week
  const weeklyArray = Array.from(weeklyMap.entries())
    .map(([week, data]) => ({
      week,
      week_start: data.week_start.toISOString().split('T')[0],
      week_end: data.week_end.toISOString().split('T')[0],
      max_reading: Math.max(...data.readings),
      min_reading: Math.min(...data.readings),
      readings: data.readings,
    }))
    .sort((a, b) => a.week.localeCompare(b.week));

  // Calculate usage between consecutive weeks
  const result = weeklyArray.map((week, index) => {
    if (index === 0) {
      // For first week, calculate within-week usage if multiple readings
      const withinWeekUsage = week.readings.length > 1 
        ? Math.abs(week.max_reading - week.min_reading)
        : 0;
      console.log(`Week ${week.week} (first):`, {
        readings: week.readings.length,
        usage: withinWeekUsage
      });
      return {
        ...week,
        usage_kwh: withinWeekUsage,
      };
    }

    const prevWeek = weeklyArray[index - 1];
    const rawUsage = week.min_reading - prevWeek.max_reading;
    const usage = Math.abs(rawUsage);

    console.log(`Week ${week.week}:`, {
      current_min: week.min_reading,
      prev_max: prevWeek.max_reading,
      usage: usage > 500 ? 0 : usage
    });

    return {
      ...week,
      usage_kwh: usage > 500 ? 0 : usage, // Filter unrealistic values
    };
  });

  console.log('Weekly result:', result);
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

  console.log('📆 calculateMonthlyUsage called with:', readings.length, 'readings');

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

  console.log('Monthly map entries:', Array.from(monthlyMap.keys()));

  // Calculate usage per month
  const monthlyArray = Array.from(monthlyMap.entries())
    .map(([month, data]) => ({
      month,
      month_start: data.month_start.toISOString().split('T')[0],
      month_end: data.month_end.toISOString().split('T')[0],
      max_reading: Math.max(...data.readings),
      min_reading: Math.min(...data.readings),
      readings: data.readings,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Calculate usage between consecutive months
  const result = monthlyArray.map((month, index) => {
    if (index === 0) {
      // For first month, calculate within-month usage if multiple readings
      const withinMonthUsage = month.readings.length > 1 
        ? Math.abs(month.max_reading - month.min_reading)
        : 0;
      console.log(`Month ${month.month} (first):`, {
        readings: month.readings.length,
        usage: withinMonthUsage
      });
      return {
        ...month,
        usage_kwh: withinMonthUsage,
      };
    }

    const prevMonth = monthlyArray[index - 1];
    const rawUsage = month.min_reading - prevMonth.max_reading;
    const usage = Math.abs(rawUsage);

    console.log(`Month ${month.month}:`, {
      current_min: month.min_reading,
      prev_max: prevMonth.max_reading,
      usage: usage > 500 ? 0 : usage
    });

    return {
      ...month,
      usage_kwh: usage > 500 ? 0 : usage, // Filter unrealistic values
    };
  });

  console.log('Monthly result:', result);
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


/**
 * Compute Daily Usage from Meter Readings
 * 
 * IMPORTANT: Meter readings represent REMAINING kWh, not consumption.
 * Consumption = previous_reading - current_reading
 * 
 * Algorithm:
 * 1. Sort readings by date ascending
 * 2. For each pair (prev, next):
 *    - Calculate consumption: prev.kwh_value - next.kwh_value
 *    - Calculate days between dates
 *    - Distribute consumption evenly across gap days
 * 3. Fill missing dates with distributed usage
 * 4. First date always has usage = 0
 * 
 * @param {Array} readings - Array of reading objects with { kwh_value, date } (Supabase) or { reading_kwh, created_at } (legacy)
 * @returns {Array} Array of { date, usage_kwh, meterValue } objects
 */
export const computeDailyUsage = (readings) => {
    if (!readings || readings.length === 0) {
        return [];
    }

    // Normalize readings to use consistent field names
    const normalizedReadings = readings.map(r => ({
        kwh_value: r.kwh_value || r.reading_kwh,
        date: r.date || r.created_at
    }));

    // Sort readings by date ascending (oldest first)
    const sortedReadings = [...normalizedReadings].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
    });

    // If only one reading, return it with 0 usage
    if (sortedReadings.length === 1) {
        const date = normalizeDate(sortedReadings[0].date);
        return [{
            date,
            usage_kwh: 0,
            meterValue: sortedReadings[0].kwh_value
        }];
    }

    const dailyUsageMap = new Map();

    // Process each pair of consecutive readings
    for (let i = 0; i < sortedReadings.length - 1; i++) {
        const prevReading = sortedReadings[i];
        const nextReading = sortedReadings[i + 1];

        const prevDate = normalizeDate(prevReading.date);
        const nextDate = normalizeDate(nextReading.date);

        const prevMeter = parseFloat(prevReading.kwh_value);
        const nextMeter = parseFloat(nextReading.kwh_value);

        // Calculate consumption (previous - current)
        // If meter increased (invalid), treat as 0 consumption but flag as Top Up
        let consumption = prevMeter - nextMeter;
        let isTopUp = false;

        if (consumption < 0) {
            consumption = 0;
            isTopUp = true;
        }

        // Calculate days between readings
        const daysBetween = getDaysBetween(prevDate, nextDate);

        // Distribute consumption evenly across days
        const dailyUsage = daysBetween > 0 ? consumption / daysBetween : 0;

        // First date always has 0 usage
        if (!dailyUsageMap.has(prevDate)) {
            dailyUsageMap.set(prevDate, {
                date: prevDate,
                usage_kwh: 0,
                isTopUp: false,
                meterValue: prevMeter
            });
        }

        // Fill all dates between prev and next (excluding prev, including next)
        const dateRange = getDateRange(prevDate, nextDate);
        dateRange.forEach((date, index) => {
            if (index === 0) return; // Skip first date (already set to 0)

            if (!dailyUsageMap.has(date)) {
                dailyUsageMap.set(date, {
                    date,
                    usage_kwh: dailyUsage,
                    isTopUp: isTopUp && index === 1, // Only mark the first day of the gap as Top Up to clear the chart
                    meterValue: index === dateRange.length - 1 ? nextMeter : null
                });
            }
        });
    }

    // Handle the last reading if not already in map
    const lastReading = sortedReadings[sortedReadings.length - 1];
    const lastDate = normalizeDate(lastReading.date);
    if (!dailyUsageMap.has(lastDate)) {
        dailyUsageMap.set(lastDate, {
            date: lastDate,
            usage_kwh: 0,
            isTopUp: false,
            meterValue: parseFloat(lastReading.kwh_value)
        });
    }

    // Convert map to array and sort by date descending (newest first)
    const result = Array.from(dailyUsageMap.values()).sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });

    return result;
};

/**
 * Normalize date to YYYY-MM-DD format
 * @param {Date|string} date - Date object or string
 * @returns {string} Date in YYYY-MM-DD format
 */
const normalizeDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Get number of days between two dates
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {number} Number of days
 */
const getDaysBetween = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

/**
 * Get array of dates between start and end (inclusive)
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Array<string>} Array of dates in YYYY-MM-DD format
 */
const getDateRange = (startDate, endDate) => {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    let current = new Date(start);
    while (current <= end) {
        dates.push(normalizeDate(current));
        current.setDate(current.getDate() + 1);
    }

    return dates;
};

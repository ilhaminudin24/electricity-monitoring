/**
 * Aggregate daily usage into weekly totals
 * @param {Array} dailyUsage - Array of { date, usage_kwh } objects
 * @param {number} weeks - Number of weeks to include (default: 12)
 * @returns {Array} Array of { week, usage_kwh, startDate, endDate } objects
 */
export const aggregateWeekly = (dailyUsage, weeks = 12) => {
    if (!dailyUsage || dailyUsage.length === 0) {
        return [];
    }

    const weeklyMap = new Map();

    dailyUsage.forEach(day => {
        const date = new Date(day.date);
        const weekKey = getWeekKey(date);

        if (!weeklyMap.has(weekKey)) {
            weeklyMap.set(weekKey, {
                week: weekKey,
                usage_kwh: 0,
                startDate: getWeekStart(date),
                endDate: getWeekEnd(date),
                days: []
            });
        }

        const weekData = weeklyMap.get(weekKey);
        weekData.usage_kwh += day.usage_kwh;
        weekData.days.push(day.date);
    });

    // Convert to array and sort by week descending (newest first)
    const result = Array.from(weeklyMap.values())
        .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
        .slice(0, weeks);

    return result;
};

/**
 * Get week key in format "YYYY-Www" (ISO week)
 * @param {Date} date - Date object
 * @returns {string} Week key
 */
const getWeekKey = (date) => {
    const year = date.getFullYear();
    const weekNum = getWeekNumber(date);
    return `${year}-W${String(weekNum).padStart(2, '0')}`;
};

/**
 * Get ISO week number
 * @param {Date} date - Date object
 * @returns {number} Week number
 */
const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

/**
 * Get start of week (Monday)
 * @param {Date} date - Date object
 * @returns {string} Date in YYYY-MM-DD format
 */
const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    d.setDate(diff);
    return normalizeDate(d);
};

/**
 * Get end of week (Sunday)
 * @param {Date} date - Date object
 * @returns {string} Date in YYYY-MM-DD format
 */
const getWeekEnd = (date) => {
    const start = new Date(getWeekStart(date));
    start.setDate(start.getDate() + 6);
    return normalizeDate(start);
};

/**
 * Normalize date to YYYY-MM-DD format
 * @param {Date} date - Date object
 * @returns {string} Date in YYYY-MM-DD format
 */
const normalizeDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Aggregate daily usage into monthly totals
 * @param {Array} dailyUsage - Array of { date, usage_kwh } objects
 * @param {number} months - Number of months to include (default: 12)
 * @returns {Array} Array of { month, usage_kwh, year, monthName } objects
 */
export const aggregateMonthly = (dailyUsage, months = 12) => {
    if (!dailyUsage || dailyUsage.length === 0) {
        return [];
    }

    const monthlyMap = new Map();

    dailyUsage.forEach(day => {
        const date = new Date(day.date);
        const monthKey = getMonthKey(date);

        if (!monthlyMap.has(monthKey)) {
            monthlyMap.set(monthKey, {
                month: monthKey,
                usage_kwh: 0,
                year: date.getFullYear(),
                monthName: getMonthName(date),
                days: []
            });
        }

        const monthData = monthlyMap.get(monthKey);
        monthData.usage_kwh += day.usage_kwh;
        monthData.days.push(day.date);
    });

    // Convert to array and sort by month descending (newest first)
    const result = Array.from(monthlyMap.values())
        .sort((a, b) => {
            const dateA = new Date(a.month + '-01');
            const dateB = new Date(b.month + '-01');
            return dateB - dateA;
        })
        .slice(0, months);

    return result;
};

/**
 * Get month key in format "YYYY-MM"
 * @param {Date} date - Date object
 * @returns {string} Month key
 */
const getMonthKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
};

/**
 * Get month name
 * @param {Date} date - Date object
 * @returns {string} Month name (e.g., "Jan", "Feb")
 */
const getMonthName = (date) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames[date.getMonth()];
};

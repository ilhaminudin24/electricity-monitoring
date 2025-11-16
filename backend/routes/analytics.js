const express = require('express');
const router = express.Router();
const db = require('../database/db');

/**
 * GET /api/analytics/daily
 * Get daily usage analytics
 */
router.get('/daily', (req, res) => {
  const { days = 30 } = req.query;
  
  // Get the last reading of each day
  const sql = `
    SELECT 
      DATE(created_at) as date,
      MAX(reading_kwh) as last_reading,
      MAX(created_at) as last_reading_time
    FROM meter_readings
    WHERE created_at >= datetime('now', '-' || ? || ' days')
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `;

  const database = db.getDb();
  database.all(sql, [days], (err, rows) => {
    if (err) {
      console.error('Error fetching daily analytics:', err.message);
      return res.status(500).json({ error: 'Failed to fetch daily analytics' });
    }
    
    // Calculate usage between consecutive days
    const processedRows = rows.map((row, index) => {
      if (index > 0) {
        const prevRow = rows[index - 1];
        row.usage_kwh = row.last_reading - prevRow.last_reading;
        if (row.usage_kwh < 0) row.usage_kwh = 0; // Handle meter resets
      } else {
        row.usage_kwh = 0; // First day has no previous day to compare
      }
      return {
        date: row.date,
        usage_kwh: parseFloat(row.usage_kwh.toFixed(2)),
        last_reading: row.last_reading
      };
    });

    res.json(processedRows);
  });
});

/**
 * GET /api/analytics/weekly
 * Get weekly usage analytics
 */
router.get('/weekly', (req, res) => {
  const { weeks = 12 } = req.query;
  
  // Get the last reading of each week
  const sql = `
    SELECT 
      strftime('%Y-W%W', created_at) as week,
      DATE(MIN(created_at)) as week_start,
      DATE(MAX(created_at)) as week_end,
      MAX(reading_kwh) as last_reading
    FROM meter_readings
    WHERE created_at >= datetime('now', '-' || (? * 7) || ' days')
    GROUP BY strftime('%Y-W%W', created_at)
    ORDER BY week ASC
  `;

  const database = db.getDb();
  database.all(sql, [weeks], (err, rows) => {
    if (err) {
      console.error('Error fetching weekly analytics:', err.message);
      return res.status(500).json({ error: 'Failed to fetch weekly analytics' });
    }
    
    // Calculate usage between consecutive weeks
    const processedRows = rows.map((row, index) => {
      if (index > 0) {
        const prevRow = rows[index - 1];
        row.usage_kwh = row.last_reading - prevRow.last_reading;
        if (row.usage_kwh < 0) row.usage_kwh = 0;
      } else {
        row.usage_kwh = 0;
      }
      return {
        week: row.week,
        week_start: row.week_start,
        week_end: row.week_end,
        usage_kwh: parseFloat(row.usage_kwh.toFixed(2))
      };
    });

    res.json(processedRows);
  });
});

/**
 * GET /api/analytics/monthly
 * Get monthly usage analytics
 */
router.get('/monthly', (req, res) => {
  const { months = 12 } = req.query;
  
  // Get the last reading of each month
  const sql = `
    SELECT 
      strftime('%Y-%m', created_at) as month,
      DATE(MIN(created_at)) as month_start,
      DATE(MAX(created_at)) as month_end,
      MAX(reading_kwh) as last_reading
    FROM meter_readings
    WHERE created_at >= datetime('now', '-' || ? || ' months')
    GROUP BY strftime('%Y-%m', created_at)
    ORDER BY month ASC
  `;

  const database = db.getDb();
  database.all(sql, [months], (err, rows) => {
    if (err) {
      console.error('Error fetching monthly analytics:', err.message);
      return res.status(500).json({ error: 'Failed to fetch monthly analytics' });
    }
    
    // Calculate usage between consecutive months
    const processedRows = rows.map((row, index) => {
      if (index > 0) {
        const prevRow = rows[index - 1];
        row.usage_kwh = row.last_reading - prevRow.last_reading;
        if (row.usage_kwh < 0) row.usage_kwh = 0;
      } else {
        row.usage_kwh = 0;
      }
      return {
        month: row.month,
        month_start: row.month_start,
        month_end: row.month_end,
        usage_kwh: parseFloat(row.usage_kwh.toFixed(2))
      };
    });

    res.json(processedRows);
  });
});

/**
 * GET /api/analytics/prediction
 * Get token depletion prediction and cost analytics
 */
router.get('/prediction', (req, res) => {
  const database = db.getDb();
  
  // Get latest reading with token info
  const latestSql = `
    SELECT * FROM meter_readings 
    WHERE token_amount IS NOT NULL 
    ORDER BY created_at DESC 
    LIMIT 1
  `;
  
  database.get(latestSql, [], (err, latest) => {
    if (err) {
      console.error('Error fetching latest reading:', err.message);
      return res.status(500).json({ error: 'Failed to fetch latest reading' });
    }

    if (!latest || !latest.token_amount) {
      return res.json({
        hasToken: false,
        message: 'No token information available'
      });
    }

    // Get daily average usage from last 30 days
    const avgUsageSql = `
      SELECT 
        AVG(daily_usage) as avg_daily_usage
      FROM (
        SELECT 
          DATE(created_at) as date,
          MAX(reading_kwh) - MIN(reading_kwh) as daily_usage
        FROM meter_readings
        WHERE created_at >= datetime('now', '-30 days')
        GROUP BY DATE(created_at)
        HAVING daily_usage > 0
      )
    `;

    database.get(avgUsageSql, [], (err, avgResult) => {
      if (err) {
        console.error('Error calculating average usage:', err.message);
        return res.status(500).json({ error: 'Failed to calculate average usage' });
      }

      const avgDailyUsage = avgResult?.avg_daily_usage || 0;
      const remainingKwh = latest.token_amount;
      const daysUntilDepletion = avgDailyUsage > 0 ? Math.ceil(remainingKwh / avgDailyUsage) : null;
      const predictedDate = daysUntilDepletion 
        ? new Date(Date.now() + daysUntilDepletion * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : null;

      // Calculate cost per kWh if token_cost is available
      const costPerKwh = latest.token_cost && latest.token_amount 
        ? latest.token_cost / latest.token_amount 
        : null;

      // Get current month usage (last reading of current month - last reading of previous month)
      const currentMonthSql = `
        SELECT 
          (SELECT MAX(reading_kwh) FROM meter_readings 
           WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')) as current_month_last,
          (SELECT MAX(reading_kwh) FROM meter_readings 
           WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', datetime('now', '-1 month'))) as prev_month_last
      `;

      database.get(currentMonthSql, [], (err, monthResult) => {
        if (err) {
          console.error('Error calculating monthly usage:', err.message);
          return res.status(500).json({ error: 'Failed to calculate monthly usage' });
        }

        const currentMonthLast = monthResult?.current_month_last || 0;
        const prevMonthLast = monthResult?.prev_month_last || 0;
        const monthlyUsage = currentMonthLast > 0 && prevMonthLast > 0 
          ? Math.max(0, currentMonthLast - prevMonthLast)
          : 0;
        const estimatedMonthlyCost = costPerKwh ? monthlyUsage * costPerKwh : null;

        res.json({
          hasToken: true,
          currentToken: latest.token_amount,
          tokenCost: latest.token_cost,
          remainingKwh: remainingKwh,
          avgDailyUsage: parseFloat(avgDailyUsage.toFixed(2)),
          daysUntilDepletion: daysUntilDepletion,
          predictedDepletionDate: predictedDate,
          costPerKwh: costPerKwh ? parseFloat(costPerKwh.toFixed(2)) : null,
          currentMonthUsage: parseFloat(monthlyUsage.toFixed(2)),
          estimatedMonthlyCost: estimatedMonthlyCost ? parseFloat(estimatedMonthlyCost.toFixed(2)) : null
        });
      });
    });
  });
});

module.exports = router;


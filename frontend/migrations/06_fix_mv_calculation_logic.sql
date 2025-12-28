-- ============================================================================
-- Fix: Materialized View Calculation Logic (Postgres Compatible)
-- Issue: The previous view logic treated METER_READING as a negative delta (consumption),
--        but in the application, specific readings are stored as ABSOLUTE VALUES.
--        This caused the calculated position to be wrong.
--        Attempted IGNORE NULLS syntax failed (Postgres limitation).
-- Solution: Use grouping technique (COUNT) + FIRST_VALUE to simulate LAST_VALUE behavior.
-- Logic: 
--   1. Create "reading_grp" that increments at every METER_READING.
--   2. In each group, the first row is the Reading (value) or NULL (if group 0).
--   3. Use FIRST_VALUE within group to get the base reading.
--   4. Sum deltas within group.
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS electricity_readings_mv CASCADE;

CREATE MATERIALIZED VIEW electricity_readings_mv AS
WITH ordered_events AS (
    SELECT 
        id,
        user_id,
        event_type,
        event_date,
        kwh_amount,
        token_cost,
        notes,
        meter_photo_url,
        created_at,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY event_date ASC, created_at ASC) as seq
    FROM token_events
    WHERE is_voided = FALSE
      AND event_type != 'VOID'
),
annotated_events AS (
    SELECT 
        *,
        -- Identify rows that reset the position (Readings)
        CASE 
            WHEN event_type = 'METER_READING' THEN kwh_amount 
            ELSE NULL 
        END as reading_val,
        
        -- Identify delta amounts (Topups and Adjustments)
        CASE 
            WHEN event_type = 'TOPUP' OR event_type = 'ADJUSTMENT' THEN kwh_amount 
            ELSE 0 
        END as delta_val
    FROM ordered_events
),
with_groups AS (
    SELECT 
        *,
        -- Create groups starting at each reading
        COUNT(reading_val) OVER (PARTITION BY user_id ORDER BY seq) as reading_grp
    FROM annotated_events
),
with_calculations AS (
    SELECT 
        *,
        -- Get the reading value for this group (it's the value of the first item in the group)
        FIRST_VALUE(reading_val) OVER (
            PARTITION BY user_id, reading_grp 
            ORDER BY seq
        ) as last_reading_kwh,
        
        -- Sum deltas within this group
        SUM(delta_val) OVER (
            PARTITION BY user_id, reading_grp 
            ORDER BY seq 
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) as delta_sum_in_grp
    FROM with_groups
)
SELECT 
    id,
    user_id,
    event_date::DATE AS date,
    -- Calculate final position
    CASE 
        WHEN event_type = 'METER_READING' THEN kwh_amount
        ELSE 
            -- If there is a previous reading, start from it. If not (first Setup/Topups), start from 0.
            COALESCE(last_reading_kwh, 0) + delta_sum_in_grp
    END AS calculated_position, -- mapped to kwh_value
    
    token_cost,
    
    CASE WHEN event_type = 'TOPUP' THEN kwh_amount ELSE NULL END AS token_amount,
    
    notes,
    meter_photo_url,
    created_at
FROM with_calculations
ORDER BY event_date DESC;

-- Recreate unique index for concurrent refresh
CREATE UNIQUE INDEX electricity_readings_mv_id_idx ON electricity_readings_mv (id);

-- Recreate regular view alias
DROP VIEW IF EXISTS electricity_readings_v;
CREATE VIEW electricity_readings_v AS SELECT * FROM electricity_readings_mv;

-- Grant permissions
GRANT SELECT ON electricity_readings_mv TO authenticated;
GRANT SELECT ON electricity_readings_v TO authenticated;

-- Initial refresh
REFRESH MATERIALIZED VIEW electricity_readings_mv;

-- ============================================================================
-- Fix: Exclude VOID events from materialized view
-- Issue: VOID events were appearing in history because view only filtered
--        is_voided = false, but VOID events themselves have is_voided = false
-- Solution: Also filter out event_type = 'VOID'
-- ============================================================================

-- Drop and recreate the materialized view with correct filter
DROP MATERIALIZED VIEW IF EXISTS electricity_readings_mv CASCADE;

CREATE MATERIALIZED VIEW electricity_readings_mv AS
WITH position_calc AS (
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
        -- Calculate running position using window function
        SUM(CASE 
            WHEN event_type = 'TOPUP' THEN kwh_amount
            WHEN event_type = 'ADJUSTMENT' THEN kwh_amount
            ELSE -kwh_amount  -- METER_READING decreases position (consumption)
        END) OVER (
            PARTITION BY user_id 
            ORDER BY event_date
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS calculated_position
    FROM token_events
    WHERE is_voided = false 
      AND event_type != 'VOID'  -- CRITICAL FIX: Exclude VOID events
)
SELECT 
    id,
    user_id,
    event_date::DATE AS date,  -- Convert to DATE for compatibility
    calculated_position AS kwh_value,
    token_cost,
    CASE WHEN event_type = 'TOPUP' THEN kwh_amount ELSE NULL END AS token_amount,
    notes,
    meter_photo_url,
    created_at
FROM position_calc
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

-- Verify fix
DO $$
DECLARE
    v_void_count INTEGER;
    v_total_count INTEGER;
BEGIN
    -- Count VOID events in view (should be 0)
    SELECT COUNT(*) INTO v_void_count
    FROM electricity_readings_v v
    JOIN token_events e ON e.id = v.id
    WHERE e.event_type = 'VOID';
    
    -- Count total events in view
    SELECT COUNT(*) INTO v_total_count
    FROM electricity_readings_v;
    
    RAISE NOTICE '=== Materialized View Fix Verification ===';
    RAISE NOTICE 'Total events in view: %', v_total_count;
    RAISE NOTICE 'VOID events in view: %', v_void_count;
    
    IF v_void_count = 0 THEN
        RAISE NOTICE '✓ Fix successful! No VOID events in view.';
    ELSE
        RAISE WARNING '⚠ Fix incomplete! Still have % VOID events in view.', v_void_count;
    END IF;
END $$;

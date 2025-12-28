-- ============================================================================
-- Phase 2: Data Migration Script
-- Option 2A Implementation - Single Source of Truth Architecture
-- Con #3 Mitigation: Automated Migration with Validation
-- ============================================================================

-- ============================================================================
-- Pre-Migration Validation
-- ============================================================================

DO $$
DECLARE
    v_readings_count INT;
    v_events_count INT;
    v_users_count INT;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PRE-MIGRATION VALIDATION';
    RAISE NOTICE '========================================';
    
    -- Count records in electricity_readings
    SELECT COUNT(*) INTO v_readings_count FROM electricity_readings;
    RAISE NOTICE 'electricity_readings: % records', v_readings_count;
    
    -- Count non-voided events
    SELECT COUNT(*) INTO v_events_count FROM token_events WHERE is_voided = false;
    RAISE NOTICE 'token_events (non-voided): % records', v_events_count;
    
    -- Count unique users
    SELECT COUNT(DISTINCT user_id) INTO v_users_count FROM electricity_readings;
    RAISE NOTICE 'Unique users: %', v_users_count;
    
    -- Date range
    RAISE NOTICE 'Date range: % to %', 
        (SELECT MIN(date) FROM electricity_readings),
        (SELECT MAX(date) FROM electricity_readings);
    
    RAISE NOTICE '========================================';
END $$;

-- Check for duplicate dates (potential conflicts)
SELECT 
    user_id,
    date,
    COUNT(*) AS reading_count,
    ARRAY_AGG(id) AS reading_ids
FROM electricity_readings
GROUP BY user_id, date
HAVING COUNT(*) > 1;

-- ============================================================================
-- Main Migration Script
-- ============================================================================

DO $$
DECLARE
    v_migrated_count INT := 0;
    v_skipped_count INT := 0;
    v_error_count INT := 0;
    v_reading RECORD;
    v_event_type TEXT;
    v_start_time TIMESTAMPTZ;
    v_end_time TIMESTAMPTZ;
BEGIN
    v_start_time := NOW();
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'STARTING MIGRATION AT %', v_start_time;
    RAISE NOTICE '========================================';
    
    -- Loop through all readings in chronological order
    FOR v_reading IN 
        SELECT * FROM electricity_readings 
        WHERE user_id IS NOT NULL
        ORDER BY user_id, date ASC
    LOOP
        BEGIN
            -- Check if event already exists (avoid duplicates)
            IF EXISTS (
                SELECT 1 FROM token_events 
                WHERE user_id = v_reading.user_id 
                AND event_date::DATE = v_reading.date
                AND is_voided = false
            ) THEN
                v_skipped_count := v_skipped_count + 1;
                CONTINUE;
            END IF;
            
            -- Determine event type based on token_amount
            -- If token_amount exists and > 0, it's a TOPUP
            -- Otherwise, it's a METER_READING
            v_event_type := CASE 
                WHEN v_reading.token_amount IS NOT NULL AND v_reading.token_amount > 0 
                THEN 'TOPUP'
                ELSE 'METER_READING'
            END;
            
            -- Insert into token_events
            INSERT INTO token_events (
                user_id,
                event_type,
                event_date,
                kwh_amount,
                token_cost,
                notes,
                meter_photo_url,
                created_by,
                metadata,
                created_at
            ) VALUES (
                v_reading.user_id,
                v_event_type,
                v_reading.date::TIMESTAMPTZ,  -- Convert DATE to TIMESTAMPTZ
                COALESCE(v_reading.token_amount, v_reading.kwh_value),
                v_reading.token_cost,
                v_reading.notes,
                v_reading.meter_photo_url,
                v_reading.user_id,
                jsonb_build_object(
                    'migrated_from', 'electricity_readings',
                    'original_id', v_reading.id,
                    'migrated_at', NOW(),
                    'original_kwh_value', v_reading.kwh_value,
                    'migration_note', 'Automated migration from dual-write to single source of truth'
                ),
                v_reading.created_at
            );
            
            v_migrated_count := v_migrated_count + 1;
            
            -- Progress logging every 100 records
            IF v_migrated_count % 100 = 0 THEN
                RAISE NOTICE 'Progress: % records migrated, % skipped', 
                    v_migrated_count, v_skipped_count;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            v_error_count := v_error_count + 1;
            RAISE WARNING 'Failed to migrate reading % (user: %, date: %): %', 
                v_reading.id, v_reading.user_id, v_reading.date, SQLERRM;
        END;
    END LOOP;
    
    v_end_time := NOW();
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRATION COMPLETE AT %', v_end_time;
    RAISE NOTICE 'Duration: %', v_end_time - v_start_time;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '  - Migrated: % records', v_migrated_count;
    RAISE NOTICE '  - Skipped (duplicates): % records', v_skipped_count;
    RAISE NOTICE '  - Errors: % records', v_error_count;
    RAISE NOTICE '========================================';
    
    IF v_error_count > 0 THEN
        RAISE WARNING 'Migration completed with % errors. Review warnings above.', v_error_count;
    ELSE
        RAISE NOTICE '✓ Migration completed successfully with no errors!';
    END IF;
END $$;

-- ============================================================================
-- Post-Migration Validation
-- ============================================================================

DO $$
DECLARE
    v_readings_count INT;
    v_events_count INT;
    v_match_count INT;
    v_mismatch_count INT;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'POST-MIGRATION VALIDATION';
    RAISE NOTICE '========================================';
    
    -- Count records
    SELECT COUNT(*) INTO v_readings_count FROM electricity_readings;
    SELECT COUNT(*) INTO v_events_count FROM token_events WHERE is_voided = false;
    
    RAISE NOTICE 'electricity_readings: % records', v_readings_count;
    RAISE NOTICE 'token_events (non-voided): % records', v_events_count;
    
    -- Validate data matches
    WITH migration_check AS (
        SELECT 
            er.id,
            er.user_id,
            er.date,
            er.kwh_value AS er_kwh,
            mv.kwh_value AS mv_kwh,
            er.token_cost AS er_cost,
            mv.token_cost AS mv_cost,
            CASE 
                WHEN ABS(COALESCE(er.kwh_value, 0) - COALESCE(mv.kwh_value, 0)) < 0.01 
                AND COALESCE(er.token_cost, 0) = COALESCE(mv.token_cost, 0)
                THEN 'MATCH'
                ELSE 'MISMATCH'
            END AS status
        FROM electricity_readings er
        LEFT JOIN electricity_readings_mv mv ON er.id = mv.id
    )
    SELECT 
        COUNT(*) FILTER (WHERE status = 'MATCH') INTO v_match_count,
        COUNT(*) FILTER (WHERE status = 'MISMATCH') INTO v_mismatch_count
    FROM migration_check;
    
    RAISE NOTICE 'Data validation:';
    RAISE NOTICE '  - Matches: %', v_match_count;
    RAISE NOTICE '  - Mismatches: %', v_mismatch_count;
    
    -- Check for missing records
    IF EXISTS (
        SELECT 1 FROM electricity_readings er
        WHERE NOT EXISTS (
            SELECT 1 FROM token_events te 
            WHERE te.user_id = er.user_id 
            AND te.event_date::DATE = er.date
            AND te.is_voided = false
        )
    ) THEN
        RAISE WARNING '⚠ Some records from electricity_readings are missing in token_events';
        
        -- Show missing records
        SELECT 
            er.user_id,
            er.date,
            er.kwh_value,
            'Missing in token_events' AS issue
        FROM electricity_readings er
        WHERE NOT EXISTS (
            SELECT 1 FROM token_events te 
            WHERE te.user_id = er.user_id 
            AND te.event_date::DATE = er.date
            AND te.is_voided = false
        )
        LIMIT 10;
    ELSE
        RAISE NOTICE '✓ All records successfully migrated!';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- Refresh Materialized View
-- ============================================================================

RAISE NOTICE 'Refreshing materialized view...';
REFRESH MATERIALIZED VIEW CONCURRENTLY electricity_readings_mv;
RAISE NOTICE '✓ Materialized view refreshed';

-- ============================================================================
-- Final Statistics
-- ============================================================================

SELECT 
    'electricity_readings' AS table_name,
    COUNT(*) AS total_records,
    COUNT(DISTINCT user_id) AS unique_users,
    MIN(date) AS earliest_date,
    MAX(date) AS latest_date,
    pg_size_pretty(pg_total_relation_size('electricity_readings')) AS table_size
FROM electricity_readings
UNION ALL
SELECT 
    'token_events' AS table_name,
    COUNT(*) AS total_records,
    COUNT(DISTINCT user_id) AS unique_users,
    MIN(event_date::DATE) AS earliest_date,
    MAX(event_date::DATE) AS latest_date,
    pg_size_pretty(pg_total_relation_size('token_events')) AS table_size
FROM token_events
WHERE is_voided = false
UNION ALL
SELECT 
    'electricity_readings_mv' AS table_name,
    COUNT(*) AS total_records,
    COUNT(DISTINCT user_id) AS unique_users,
    MIN(date) AS earliest_date,
    MAX(date) AS latest_date,
    pg_size_pretty(pg_total_relation_size('electricity_readings_mv')) AS table_size
FROM electricity_readings_mv;

-- ============================================================================
-- Migration Complete
-- ============================================================================

RAISE NOTICE '========================================';
RAISE NOTICE '✓ PHASE 2 MIGRATION COMPLETE';
RAISE NOTICE '========================================';
RAISE NOTICE 'Next steps:';
RAISE NOTICE '1. Review validation results above';
RAISE NOTICE '2. Test queries on electricity_readings_v';
RAISE NOTICE '3. Proceed to Phase 3 (Service Layer Migration)';
RAISE NOTICE '========================================';

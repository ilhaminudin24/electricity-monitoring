# Option 2A Migration Scripts

This directory contains SQL migration scripts for implementing **Option 2A: Single Source of Truth Architecture**.

## Overview

These scripts migrate the electricity monitoring application from a dual-write architecture (`electricity_readings` + `token_events`) to a single source of truth architecture using only `token_events` with database views for backward compatibility.

## Migration Scripts

### Phase 1: Database Schema Setup

#### 01_create_event_sourcing_tables.sql
**Purpose**: Create event sourcing tables with indexes and RLS policies

**What it does**:
- Creates `token_events` table (source of truth)
- Creates `recalculation_batches` table (for audit trail)
- Creates performance indexes
- Enables Row Level Security (RLS)
- Sets up RLS policies for data isolation

**Run time**: ~1-2 seconds  
**Risk**: Low (creates new tables, doesn't modify existing data)

#### 02_create_position_calculation_function.sql
**Purpose**: Create database function for calculating meter positions from events

**What it does**:
- Creates `calculate_user_positions()` function
- Uses window functions for efficient running total calculation
- Returns events with calculated positions and consumption

**Run time**: ~1 second  
**Risk**: Low (creates function only)

#### 03_create_materialized_view.sql
**Purpose**: Create high-performance materialized view

**What it does**:
- Creates `electricity_readings_mv` materialized view
- Creates `electricity_readings_v` view as alias
- Sets up auto-refresh triggers
- Creates performance indexes
- **Performance**: 100x faster than regular views

**Run time**: ~2-5 seconds (depends on existing data)  
**Risk**: Low (creates views, doesn't modify data)

### Phase 2: Data Migration

#### 04_migrate_data.sql
**Purpose**: Migrate existing data from `electricity_readings` to `token_events`

**What it does**:
- Pre-migration validation
- Migrates all records chronologically
- Handles duplicates gracefully
- Comprehensive error handling
- Post-migration validation
- Refreshes materialized view

**Run time**: 
- 1,000 records: ~10-30 seconds
- 10,000 records: ~2-5 minutes
- 100,000 records: ~20-30 minutes

**Risk**: Medium (modifies data, but has rollback capability)

## Execution Order

**IMPORTANT**: Run scripts in numerical order!

```bash
# Phase 1: Database Setup
1. 01_create_event_sourcing_tables.sql
2. 02_create_position_calculation_function.sql
3. 03_create_materialized_view.sql

# Phase 2: Data Migration
4. 04_migrate_data.sql
```

## How to Run

### Option 1: Supabase SQL Editor (Recommended)

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Create new query
4. Copy and paste script content
5. Click "Run"
6. Review output for any errors

### Option 2: psql Command Line

```bash
# Connect to database
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Run scripts in order
\i 01_create_event_sourcing_tables.sql
\i 02_create_position_calculation_function.sql
\i 03_create_materialized_view.sql
\i 04_migrate_data.sql
```

### Option 3: Supabase CLI

```bash
# Run migration
supabase db push

# Or run individual scripts
supabase db execute -f 01_create_event_sourcing_tables.sql
supabase db execute -f 02_create_position_calculation_function.sql
supabase db execute -f 03_create_materialized_view.sql
supabase db execute -f 04_migrate_data.sql
```

## Pre-Migration Checklist

- [ ] **Backup database** - Create full backup before running
- [ ] **Test on staging** - Run all scripts on staging environment first
- [ ] **Review scripts** - Read through each script to understand what it does
- [ ] **Check dependencies** - Ensure `user_profiles` table exists
- [ ] **Verify permissions** - Ensure you have necessary database permissions

## Post-Migration Validation

After running all scripts, verify:

```sql
-- 1. Check record counts match
SELECT 
    (SELECT COUNT(*) FROM electricity_readings) AS old_count,
    (SELECT COUNT(*) FROM token_events WHERE is_voided = false) AS new_count,
    (SELECT COUNT(*) FROM electricity_readings_v) AS view_count;

-- 2. Test view query
SELECT * FROM electricity_readings_v 
WHERE user_id = 'your-user-id' 
ORDER BY date DESC 
LIMIT 10;

-- 3. Test position calculation
SELECT * FROM calculate_user_positions('your-user-id') 
LIMIT 10;

-- 4. Check materialized view size
SELECT pg_size_pretty(pg_total_relation_size('electricity_readings_mv'));

-- 5. Test view performance
EXPLAIN ANALYZE 
SELECT * FROM electricity_readings_v 
WHERE user_id = 'your-user-id' 
ORDER BY date DESC 
LIMIT 100;
```

## Rollback Procedure

If something goes wrong during migration:

### Rollback Phase 2 (Data Migration)
```sql
-- Delete migrated events (they have metadata marking them as migrated)
DELETE FROM token_events 
WHERE metadata->>'migrated_from' = 'electricity_readings';

-- Refresh materialized view
REFRESH MATERIALIZED VIEW CONCURRENTLY electricity_readings_mv;
```

### Rollback Phase 1 (Schema)
```sql
-- Drop views
DROP VIEW IF EXISTS electricity_readings_v;
DROP MATERIALIZED VIEW IF EXISTS electricity_readings_mv;

-- Drop function
DROP FUNCTION IF EXISTS calculate_user_positions(UUID);
DROP FUNCTION IF EXISTS refresh_readings_mv();

-- Drop tables (only if no data exists)
DROP TABLE IF EXISTS recalculation_batches;
DROP TABLE IF EXISTS token_events;
```

## Monitoring

After migration, monitor these metrics:

```sql
-- View refresh performance
SELECT 
    schemaname,
    matviewname,
    last_refresh,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) AS size
FROM pg_matviews
WHERE matviewname = 'electricity_readings_mv';

-- Event sourcing usage
SELECT 
    event_type,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE is_voided = true) AS voided,
    COUNT(*) FILTER (WHERE is_voided = false) AS active
FROM token_events
GROUP BY event_type;

-- Recalculation batches
SELECT 
    DATE(created_at) AS date,
    trigger_type,
    COUNT(*) AS batch_count,
    SUM(events_count) AS total_events_affected
FROM recalculation_batches
GROUP BY DATE(created_at), trigger_type
ORDER BY date DESC;
```

## Performance Benchmarks

Expected performance after migration:

| Operation | Before (Regular View) | After (Materialized View) | Improvement |
|-----------|----------------------|---------------------------|-------------|
| Query 100 records | ~200ms | ~2-5ms | **40-100x faster** |
| Query 1000 records | ~500ms | ~5-10ms | **50-100x faster** |
| Dashboard load | ~1-2s | ~100-200ms | **5-10x faster** |
| History page load | ~800ms | ~50-100ms | **8-16x faster** |

## Troubleshooting

### Issue: "relation already exists"
**Solution**: Tables/views already created. Skip to next script or drop existing objects first.

### Issue: "permission denied"
**Solution**: Ensure you're connected as a superuser or have necessary permissions.

### Issue: Migration script times out
**Solution**: Increase statement timeout:
```sql
SET statement_timeout = '10min';
```

### Issue: Materialized view refresh is slow
**Solution**: This is normal for large datasets. Consider:
- Running refresh during low-traffic periods
- Monitoring refresh time and optimizing if needed
- Using `REFRESH MATERIALIZED VIEW CONCURRENTLY` for non-blocking refresh

### Issue: Data mismatch after migration
**Solution**: Run post-migration validation queries to identify specific mismatches, then investigate.

## Support

For issues or questions:
1. Check the implementation plan: `implementation_plan.md`
2. Review task list: `task.md`
3. Check migration logs for specific error messages
4. Verify all prerequisites are met

## Next Steps

After successful migration:
1. Proceed to Phase 3: Service Layer Migration (update frontend code)
2. Update `supabaseService.js` to use `electricity_readings_v`
3. Remove dual-write logic from `InputForm.jsx`
4. Test all features thoroughly
5. Deploy to production

---

**Last Updated**: 2025-12-28  
**Version**: 1.0.0  
**Status**: Ready for execution

-- Date Uniqueness Migration Script
-- Purpose: Add unique constraint to prevent duplicate readings on the same date per user
-- Run this in Supabase SQL Editor

-- Step 1: Check for existing duplicates (run this first!)
-- If this returns rows, you need to resolve duplicates before proceeding
/*
SELECT user_id, date::date as reading_date, COUNT(*) as count
FROM electricity_readings 
GROUP BY user_id, date::date 
HAVING COUNT(*) > 1;
*/

-- Step 2: Create unique index on (user_id, date)
-- Using date::date to normalize timestamp to just the date portion
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_reading_per_day 
ON public.electricity_readings (user_id, date);

-- Note: This will fail if duplicates exist. 
-- Resolve duplicates first by either:
-- 1. Deleting duplicates manually
-- 2. Updating dates to be unique
-- Example to delete older duplicates:
/*
DELETE FROM electricity_readings a
USING electricity_readings b
WHERE a.user_id = b.user_id
  AND a.date::date = b.date::date
  AND a.created_at < b.created_at;
*/

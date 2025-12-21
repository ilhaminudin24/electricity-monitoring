-- Alternative: SQL-only Migration Script
-- Run this directly in Supabase SQL Editor if Node.js script doesn't work
-- This creates a fallback tariff tier from the default settings

-- Check if tiers already exist
DO $$
DECLARE
  tier_count INTEGER;
  default_rate NUMERIC := 1444.70; -- From DEFAULT_SETTINGS
BEGIN
  -- Count existing tiers
  SELECT COUNT(*) INTO tier_count
  FROM public.token_tariff_tiers;

  -- Only insert if no tiers exist
  IF tier_count = 0 THEN
  -- Use correct rate: 1501.5 Rp/kWh (based on expected: 100rb→66.6kWh)
  INSERT INTO public.token_tariff_tiers (
    min_nominal,
    max_nominal,
    effective_tariff,
    label,
    active,
    metadata
  ) VALUES (
    1,
    NULL, -- Open-ended (unlimited)
    1501.5000, -- Correct rate: 100,000 / 66.6 = 1501.5
    'Fallback default (migrated)',
    true,
    jsonb_build_object(
      'migrated', true,
      'source', 'default_settings',
      'migration_date', NOW()
    )
  );

    RAISE NOTICE 'Fallback tariff tier created successfully!';
    RAISE NOTICE 'Range: >= 1 (unlimited)';
    RAISE NOTICE 'Effective Tariff: Rp % / kWh', default_rate;
  ELSE
    RAISE NOTICE 'Tariff tiers already exist (% tiers found). Skipping migration.', tier_count;
  END IF;
END $$;

-- Verify the tier was created
SELECT 
  id,
  min_nominal,
  max_nominal,
  effective_tariff,
  label,
  active
FROM public.token_tariff_tiers
ORDER BY min_nominal ASC;


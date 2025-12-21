-- Migration: Create Token Tariff Tiers Table
-- Date: 2025-01-XX
-- Description: Implements tiered tariff system for token-based kWh calculations

-- 1. Create token_tariff_tiers table
CREATE TABLE IF NOT EXISTS public.token_tariff_tiers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  min_nominal bigint NOT NULL,
  max_nominal bigint, -- NULL means open-ended (>= min_nominal)
  effective_tariff numeric(12,4) NOT NULL, -- Rp per kWh
  label text,
  active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT valid_nominal_range CHECK (max_nominal IS NULL OR max_nominal >= min_nominal),
  CONSTRAINT positive_min_nominal CHECK (min_nominal > 0),
  CONSTRAINT positive_tariff CHECK (effective_tariff > 0)
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_token_tariff_tiers_min_nominal ON public.token_tariff_tiers(min_nominal);
CREATE INDEX IF NOT EXISTS idx_token_tariff_tiers_max_nominal ON public.token_tariff_tiers(max_nominal);
CREATE INDEX IF NOT EXISTS idx_token_tariff_tiers_active ON public.token_tariff_tiers(active) WHERE active = true;

-- 3. Enable RLS
ALTER TABLE public.token_tariff_tiers ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Drop existing policies if they exist (for idempotent migration)
DROP POLICY IF EXISTS "Public can read active tariff tiers" ON public.token_tariff_tiers;
DROP POLICY IF EXISTS "Admins can read all tariff tiers" ON public.token_tariff_tiers;
DROP POLICY IF EXISTS "Admins can insert tariff tiers" ON public.token_tariff_tiers;
DROP POLICY IF EXISTS "Admins can update tariff tiers" ON public.token_tariff_tiers;
DROP POLICY IF EXISTS "Admins can delete tariff tiers" ON public.token_tariff_tiers;

-- Everyone can read active tiers
CREATE POLICY "Public can read active tariff tiers"
  ON public.token_tariff_tiers
  FOR SELECT
  USING (active = true);

-- Admins can read all tiers (including inactive)
CREATE POLICY "Admins can read all tariff tiers"
  ON public.token_tariff_tiers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can insert/update/delete
CREATE POLICY "Admins can insert tariff tiers"
  ON public.token_tariff_tiers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update tariff tiers"
  ON public.token_tariff_tiers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete tariff tiers"
  ON public.token_tariff_tiers
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5. Create SQL function for tier lookup
CREATE OR REPLACE FUNCTION public.get_tariff_tier_for_nominal(nominal bigint)
RETURNS TABLE (
  id uuid,
  min_nominal bigint,
  max_nominal bigint,
  effective_tariff numeric,
  label text,
  active boolean
) 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.min_nominal,
    t.max_nominal,
    t.effective_tariff,
    t.label,
    t.active
  FROM public.token_tariff_tiers t
  WHERE t.active = true
    AND t.min_nominal <= nominal
    AND (t.max_nominal IS NULL OR t.max_nominal >= nominal)
  ORDER BY t.min_nominal DESC
  LIMIT 1;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_tariff_tier_for_nominal(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tariff_tier_for_nominal(bigint) TO anon;

-- 6. Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_token_tariff_tiers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (for idempotent migration)
DROP TRIGGER IF EXISTS update_token_tariff_tiers_updated_at ON public.token_tariff_tiers;

CREATE TRIGGER update_token_tariff_tiers_updated_at
  BEFORE UPDATE ON public.token_tariff_tiers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_token_tariff_tiers_updated_at();

-- 7. Seed initial data (correct rates based on expected results)
-- Expected: 50rb→33.3kWh, 100rb→66.6kWh, 200rb→133.2kWh
-- Rate calculation: 50,000/33.3 = 100,000/66.6 = 200,000/133.2 = 1501.5 Rp/kWh
INSERT INTO public.token_tariff_tiers (min_nominal, max_nominal, effective_tariff, label, active) VALUES
  (1, 49999, 1501.5000, '1 - 49,999', true),
  (50000, 99999, 1501.5000, '50k - 99,999', true),
  (100000, 199999, 1501.5000, '100k - 199,999', true),
  (200000, 499999, 1501.5000, '200k - 499,999', true),
  (500000, NULL, 1501.5000, '>=500k', true)
ON CONFLICT DO NOTHING;

-- 8. Verify table creation
SELECT 
  'token_tariff_tiers table created successfully' as status,
  COUNT(*) as tier_count
FROM public.token_tariff_tiers;


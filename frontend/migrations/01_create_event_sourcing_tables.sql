-- ============================================================================
-- Phase 1.1: Create Event Sourcing Tables
-- Option 2A Implementation - Single Source of Truth Architecture
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Create token_events table (Source of Truth)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.token_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('TOPUP', 'METER_READING', 'ADJUSTMENT', 'VOID')),
    event_date TIMESTAMPTZ NOT NULL,
    kwh_amount NUMERIC(10, 2) NOT NULL,
    token_cost NUMERIC(12, 2),
    notes TEXT,
    meter_photo_url TEXT,
    
    -- Void tracking (soft delete)
    is_voided BOOLEAN DEFAULT false,
    voided_at TIMESTAMPTZ,
    voided_by UUID REFERENCES public.user_profiles(id),
    voided_reason TEXT,
    void_of_event UUID REFERENCES public.token_events(id),
    
    -- Recalculation tracking
    recalc_batch_id UUID,
    
    -- Audit fields
    created_by UUID REFERENCES public.user_profiles(id),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Create recalculation_batches table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.recalculation_batches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    trigger_type TEXT NOT NULL,
    trigger_event_id UUID REFERENCES public.token_events(id),
    affected_events JSONB NOT NULL,
    events_count INT NOT NULL,
    can_rollback_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    rolled_back_at TIMESTAMPTZ,
    rollback_reason TEXT,
    created_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Create Indexes for Performance
-- ============================================================================

-- token_events indexes
CREATE INDEX IF NOT EXISTS idx_token_events_user_date 
    ON public.token_events(user_id, event_date DESC);

CREATE INDEX IF NOT EXISTS idx_token_events_user_voided 
    ON public.token_events(user_id, is_voided);

CREATE INDEX IF NOT EXISTS idx_token_events_event_date 
    ON public.token_events(event_date DESC);

CREATE INDEX IF NOT EXISTS idx_token_events_recalc_batch 
    ON public.token_events(recalc_batch_id) 
    WHERE recalc_batch_id IS NOT NULL;

-- recalculation_batches indexes
CREATE INDEX IF NOT EXISTS idx_recalc_batches_user 
    ON public.recalculation_batches(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recalc_batches_trigger 
    ON public.recalculation_batches(trigger_event_id);

CREATE INDEX IF NOT EXISTS idx_recalc_batches_rollback 
    ON public.recalculation_batches(can_rollback_until) 
    WHERE rolled_back_at IS NULL;

-- ============================================================================
-- Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE public.token_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recalculation_batches ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for token_events
-- ============================================================================

-- Users can view their own events
CREATE POLICY "Users can view their own events"
    ON public.token_events FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own events
CREATE POLICY "Users can insert their own events"
    ON public.token_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own events (for voiding, recalc tracking)
CREATE POLICY "Users can update their own events"
    ON public.token_events FOR UPDATE
    USING (auth.uid() = user_id);

-- Users cannot delete events (only void them)
-- No DELETE policy = no one can hard delete

-- ============================================================================
-- RLS Policies for recalculation_batches
-- ============================================================================

-- Users can view their own batches
CREATE POLICY "Users can view their own batches"
    ON public.recalculation_batches FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own batches
CREATE POLICY "Users can insert their own batches"
    ON public.recalculation_batches FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own batches (for rollback)
CREATE POLICY "Users can update their own batches"
    ON public.recalculation_batches FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify tables created
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'token_events') THEN
        RAISE NOTICE '✓ token_events table created successfully';
    ELSE
        RAISE EXCEPTION '✗ token_events table not found';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recalculation_batches') THEN
        RAISE NOTICE '✓ recalculation_batches table created successfully';
    ELSE
        RAISE EXCEPTION '✗ recalculation_batches table not found';
    END IF;
END $$;

-- Verify indexes created
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('token_events', 'recalculation_batches')
ORDER BY tablename, indexname;

-- Verify RLS enabled
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('token_events', 'recalculation_batches');

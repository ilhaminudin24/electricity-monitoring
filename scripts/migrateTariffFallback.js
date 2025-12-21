/**
 * Migration Script: Create Fallback Tariff Tier
 * 
 * This script creates a fallback tariff tier from the default settings
 * if the token_tariff_tiers table is empty.
 * 
 * Usage: node scripts/migrateTariffFallback.js
 * 
 * Make sure to set environment variables:
 * - REACT_APP_SUPABASE_URL or VITE_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env file in root or frontend folder
const rootEnvPath = path.join(__dirname, '../.env');
const frontendEnvPath = path.join(__dirname, '../frontend/.env');

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else if (fs.existsSync(frontendEnvPath)) {
  dotenv.config({ path: frontendEnvPath });
} else {
  // Try to load from process.env (already set)
  console.log('No .env file found, using process.env variables');
}

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  console.error('\nPlease set one of:');
  console.error('  - REACT_APP_SUPABASE_URL or VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nYou can:');
  console.error('  1. Create a .env file in the root directory with these variables');
  console.error('  2. Or set them as environment variables before running the script');
  console.error('  3. Or pass them directly: SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=yyy node scripts/migrateTariffFallback.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Correct rate based on expected results: 100rb → 66.6 kWh
// Rate = 100,000 / 66.6 = 1501.5 Rp/kWh
const DEFAULT_TARIFF_RATE = 1501.50;

async function migrate() {
  console.log('Starting tariff tier migration...\n');

  try {
    // 1. Check if table exists and has any tiers
    const { data: existingTiers, error: checkError } = await supabase
      .from('token_tariff_tiers')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('Error checking existing tiers:', checkError.message);
      console.log('\nPlease run the database migration first:');
      console.log('frontend/migrations/2025_create_token_tariff_tiers.sql');
      process.exit(1);
    }

    if (existingTiers && existingTiers.length > 0) {
      console.log('✓ Tariff tiers already exist. Skipping migration.');
      console.log(`  Found ${existingTiers.length} tier(s)`);
      return;
    }

    // 2. Create fallback tier
    console.log('Creating fallback tariff tier...');
    const { data: newTier, error: insertError } = await supabase
      .from('token_tariff_tiers')
      .insert({
        min_nominal: 1,
        max_nominal: null, // Open-ended
        effective_tariff: DEFAULT_TARIFF_RATE, // 1501.5 Rp/kWh
        label: 'Fallback default (migrated - rate: 1501.5)',
        active: true,
        metadata: {
          migrated: true,
          source: 'default_settings',
          migration_date: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    console.log('✓ Fallback tier created successfully!');
    console.log(`  ID: ${newTier.id}`);
    console.log(`  Range: ≥ 1 (unlimited)`);
    console.log(`  Effective Tariff: Rp ${DEFAULT_TARIFF_RATE} / kWh`);
    console.log(`  Label: ${newTier.label}`);

    console.log('\n✓ Migration completed successfully!');
  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration
migrate();


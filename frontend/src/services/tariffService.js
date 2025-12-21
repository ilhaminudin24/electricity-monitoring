/**
 * Tariff Service
 * Handles tiered tariff system for token-based kWh calculations
 */

import { supabase } from '../supabaseClient';

/**
 * Get all active tariff tiers
 * @returns {Promise<Array>} Array of tariff tier objects
 */
export async function getAllTariffTiers() {
    try {
        const { data, error } = await supabase
            .from('token_tariff_tiers')
            .select('*')
            .eq('active', true)
            .order('min_nominal', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        throw error;
    }
}

/**
 * Get all tariff tiers (including inactive) - Admin only
 * @returns {Promise<Array>} Array of all tariff tier objects
 */
export async function getAllTariffTiersAdmin() {
    try {
        const { data, error } = await supabase
            .from('token_tariff_tiers')
            .select('*')
            .order('min_nominal', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        throw error;
    }
}

/**
 * Get tariff tier for a specific nominal amount
 * Uses RPC function for efficient lookup
 * @param {number} nominal - Token cost in Rp
 * @returns {Promise<Object|null>} Matching tier or null
 */
export async function getTariffTierForNominal(nominal) {
    try {
        const { data, error } = await supabase.rpc('get_tariff_tier_for_nominal', {
            nominal: Number(nominal)
        });

        if (error) throw error;
        return data && data.length > 0 ? data[0] : null;
    } catch (error) {
        throw error;
    }
}

/**
 * Create a new tariff tier (Admin only)
 * @param {Object} tierData - Tier data
 * @returns {Promise<Object>} Created tier
 */
export async function createTariffTier(tierData) {
    try {
        const { data, error } = await supabase
            .from('token_tariff_tiers')
            .insert({
                min_nominal: tierData.min_nominal,
                max_nominal: tierData.max_nominal || null,
                effective_tariff: tierData.effective_tariff,
                label: tierData.label || null,
                active: tierData.active !== undefined ? tierData.active : true,
                metadata: tierData.metadata || {}
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        throw error;
    }
}

/**
 * Update a tariff tier (Admin only)
 * @param {string} tierId - Tier ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated tier
 */
export async function updateTariffTier(tierId, updates) {
    try {
        const { data, error } = await supabase
            .from('token_tariff_tiers')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', tierId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        throw error;
    }
}

/**
 * Delete a tariff tier (Admin only)
 * @param {string} tierId - Tier ID
 * @returns {Promise<void>}
 */
export async function deleteTariffTier(tierId) {
    try {
        const { error } = await supabase
            .from('token_tariff_tiers')
            .delete()
            .eq('id', tierId);

        if (error) throw error;
    } catch (error) {
        throw error;
    }
}

/**
 * Find matching tier from already-fetched tiers array (synchronous)
 * Useful for UI responsiveness without repeated API calls
 * @param {Array} tiers - Array of tier objects
 * @param {number} nominal - Token cost in Rp
 * @returns {Object|null} Matching tier or null
 */
export function findTierForNominal(tiers, nominal) {
    if (!tiers || tiers.length === 0) return null;

    const numNominal = Number(nominal);

    // Sort by min_nominal descending to get highest matching tier first
    const sortedTiers = [...tiers].sort((a, b) => b.min_nominal - a.min_nominal);

    for (const tier of sortedTiers) {
        if (
            tier.active &&
            tier.min_nominal <= numNominal &&
            (tier.max_nominal === null || tier.max_nominal >= numNominal)
        ) {
            return tier;
        }
    }

    return null;
}

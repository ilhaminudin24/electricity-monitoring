/**
 * Tariff Utilities
 * Helper functions for tiered tariff calculations
 */

import { getTariffTierForNominal, findTierForNominal } from '../services/tariffService';
import { getSettings } from './settings';

/**
 * Estimate kWh from token cost using tiered tariff system
 * @param {Object} params
 * @param {number} params.tokenCost - Token cost in Rp
 * @param {number} [params.adminFee=0] - Admin fee in Rp
 * @param {number} [params.taxPercent=0] - Tax percentage (e.g., 11.87 for 11.87%)
 * @param {number} [params.fallbackRate=null] - Fallback rate if no tier found
 * @param {Array} [params.cachedTiers=null] - Pre-fetched tiers array for synchronous lookup
 * @returns {Promise<Object>} Calculation result
 */
export async function estimateKwhFromTokenCost({
    tokenCost,
    adminFee = 0,
    taxPercent = 0,
    fallbackRate = null,
    cachedTiers = null
}) {
    const tokenCostNum = Number(tokenCost);
    const adminFeeNum = Number(adminFee) || 0;
    const taxPercentNum = Number(taxPercent) || 0;

    // Calculate tax amount
    const taxAmount = tokenCostNum * (taxPercentNum / 100);

    // Calculate net amount after admin fee and tax
    const netAmount = tokenCostNum - adminFeeNum - taxAmount;

    // Try to find matching tier
    let tier = null;

    if (cachedTiers && cachedTiers.length > 0) {
        // Use cached tiers for synchronous lookup (better UX)
        tier = findTierForNominal(cachedTiers, tokenCostNum);
    } else {
        // Fallback to API call
        try {
            tier = await getTariffTierForNominal(tokenCostNum);
        } catch (error) {
            // Continue with fallback - error logged for debugging
        }
    }

    if (tier && tier.effective_tariff) {
        const effectiveTariff = Number(tier.effective_tariff);
        const kwh = netAmount / effectiveTariff;

        return {
            kwh: Number(kwh.toFixed(3)),
            effectiveTariff: effectiveTariff,
            tierLabel: tier.label || null,
            source: 'tier',
            taxAmount: Number(taxAmount.toFixed(2)),
            netAmount: Number(netAmount.toFixed(2)),
            tierId: tier.id
        };
    }

    // Fallback: use fallbackRate (from settings)
    if (fallbackRate) {
        const fallbackRateNum = Number(fallbackRate);
        const kwh = netAmount / fallbackRateNum;

        return {
            kwh: Number(kwh.toFixed(3)),
            effectiveTariff: fallbackRateNum,
            tierLabel: null,
            source: 'fallback',
            taxAmount: Number(taxAmount.toFixed(2)),
            netAmount: Number(netAmount.toFixed(2)),
            tierId: null
        };
    }

    // Last resort: get fallback from settings
    try {
        const settings = getSettings();
        const defaultRate = settings.tariffPerKwh || 1444.70;
        const kwh = netAmount / defaultRate;

        return {
            kwh: Number(kwh.toFixed(3)),
            effectiveTariff: defaultRate,
            tierLabel: null,
            source: 'settings_fallback',
            taxAmount: Number(taxAmount.toFixed(2)),
            netAmount: Number(netAmount.toFixed(2)),
            tierId: null
        };
    } catch (error) {
        // Absolute last resort
        return {
            kwh: null,
            effectiveTariff: null,
            tierLabel: null,
            source: 'none',
            taxAmount: Number(taxAmount.toFixed(2)),
            netAmount: Number(netAmount.toFixed(2)),
            tierId: null,
            error: 'Unable to calculate kWh: No tariff tier or fallback rate available'
        };
    }
}

/**
 * Get fallback rate from settings
 * @returns {number} Fallback tariff rate
 */
export function getFallbackTariffRate() {
    try {
        const settings = getSettings();
        return settings.tariffPerKwh || 1444.70;
    } catch (error) {
        return 1444.70; // Hardcoded default
    }
}

/**
 * Format tier range for display
 * @param {Object} tier - Tier object
 * @returns {string} Formatted range string
 */
export function formatTierRange(tier) {
    if (!tier) return '';

    if (tier.max_nominal === null) {
        return `≥ ${tier.min_nominal.toLocaleString('id-ID')}`;
    }

    if (tier.min_nominal === tier.max_nominal) {
        return tier.min_nominal.toLocaleString('id-ID');
    }

    return `${tier.min_nominal.toLocaleString('id-ID')} - ${tier.max_nominal.toLocaleString('id-ID')}`;
}

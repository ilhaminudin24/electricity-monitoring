/**
 * Feature Flags
 * Centralized feature flag management
 */

// Feature flags can be set via environment variables or localStorage
const getFeatureFlag = (flagName, defaultValue = false) => {
  // Check environment variable (Vite uses VITE_ prefix)
  const envKey = `VITE_${flagName}`;
  const envValue = import.meta.env[envKey];

  if (envValue !== undefined) {
    return envValue === 'true' || envValue === '1';
  }

  // Check localStorage
  const stored = localStorage.getItem(`feature_${flagName}`);
  if (stored !== null) {
    return stored === 'true';
  }

  // Return default
  return defaultValue;
};

/**
 * Check if tariff tiers feature is enabled
 */
export const isTariffTiersEnabled = () => {
  return getFeatureFlag('FEATURE_TARIFF_TIERS', true); // Default to enabled
};



/**
 * Set feature flag value (for testing/debugging)
 */
export const setFeatureFlag = (flagName, value) => {
  localStorage.setItem(`feature_${flagName}`, value.toString());
};

/**
 * Clear feature flag (use default)
 */
export const clearFeatureFlag = (flagName) => {
  localStorage.removeItem(`feature_${flagName}`);
};


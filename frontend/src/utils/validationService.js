/**
 * Validation Service for Electricity Readings
 * 
 * Handles business logic validation for prepaid meter readings.
 */

export const VALIDATION_RESULT = {
    VALID: 'VALID',
    WARNING_READING_INCREASED: 'WARNING_READING_INCREASED',
    ERROR_INVALID_VALUE: 'ERROR_INVALID_VALUE',
};

/**
 * Validate a new reading against the last reading
 * 
 * @param {number} newReading - The new meter reading value
 * @param {number} lastReading - The last known meter reading value
 * @param {boolean} isTopUpMode - Whether the user is in Top Up mode
 * @param {number|null} tokenCost - The token cost if this is a top-up
 * @returns {Object} Validation result with status, message, and suggestions
 */
export const validateReading = (newReading, lastReading, isTopUpMode = false, tokenCost = null) => {
    // Basic validation
    if (newReading === null || newReading === undefined || isNaN(newReading)) {
        return {
            status: VALIDATION_RESULT.ERROR_INVALID_VALUE,
            isValid: false,
            errorKey: 'validation.invalidReading',
        };
    }

    if (newReading < 0) {
        return {
            status: VALIDATION_RESULT.ERROR_INVALID_VALUE,
            isValid: false,
            errorKey: 'validation.negativeReading',
        };
    }

    // If no last reading exists (first reading), always valid
    if (!lastReading || lastReading === 0) {
        return {
            status: VALIDATION_RESULT.VALID,
            isValid: true,
        };
    }

    // Check if reading increased
    const readingIncreased = newReading > lastReading;

    // Top Up Mode: Reading SHOULD increase
    if (isTopUpMode) {
        // Ideally reading increases, but sometimes it might be same or slightly lower if correction
        // We generally allow anything in Top Up mode as long as it's positive
        return {
            status: VALIDATION_RESULT.VALID,
            isValid: true,
        };
    }

    // Record Reading Mode: Reading should DECREASE or stay same
    if (readingIncreased) {
        const increase = (newReading - lastReading).toFixed(2);
        return {
            status: VALIDATION_RESULT.WARNING_READING_INCREASED,
            isValid: false, // HARD BLOCK
            isBlocking: true,
            delta: increase,
            lastReading: lastReading,
            errorKey: 'validation.readingIncreasedError',
            suggestionKey: 'validation.mustUseTopUp',
        };
    }

    // Reading decreased or stayed same - normal consumption
    return {
        status: VALIDATION_RESULT.VALID,
        isValid: true,
        consumption: (lastReading - newReading).toFixed(2),
    };
};

/**
 * Get contextual validation message
 */
export const getValidationMessage = (result, t) => {
    if (!result || !result.errorKey) return null;

    return {
        title: t(result.errorKey),
        suggestion: result.suggestionKey ? t(result.suggestionKey) : null,
        delta: result.delta,
        lastReading: result.lastReading,
    };
};

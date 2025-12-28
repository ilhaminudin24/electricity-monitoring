/**
 * Event Sourcing Service for Electricity Monitoring
 * 
 * This service implements the Event Sourcing pattern for token and meter reading events.
 * All actions are stored as immutable events, and positions are calculated (derived state).
 * 
 * Key principles:
 * - Events are append-only (never modified, only voided)
 * - Positions are calculated from events, not stored directly
 * - Full audit trail with 24-hour rollback capability
 */

import { supabase } from '../supabaseClient';
import { ensureUserProfile } from './supabaseService';

// =============================================================================
// EVENT TYPES
// =============================================================================

export const EVENT_TYPES = {
    TOPUP: 'TOPUP',
    METER_READING: 'METER_READING',
    ADJUSTMENT: 'ADJUSTMENT',
    VOID: 'VOID'
};

export const TRIGGER_TYPES = {
    BACKDATE_TOPUP: 'BACKDATE_TOPUP',
    EDIT_TOPUP: 'EDIT_TOPUP',
    DELETE_TOPUP: 'DELETE_TOPUP',
    MANUAL_CORRECTION: 'MANUAL_CORRECTION'
};

// =============================================================================
// CORE EVENT OPERATIONS
// =============================================================================

/**
 * Add a new event (TOPUP or METER_READING)
 * Automatically detects if this is a backdate scenario
 * 
 * @param {string} userId - User ID
 * @param {Object} eventData - Event data
 * @param {string} eventData.eventType - 'TOPUP' or 'METER_READING'
 * @param {Date|string} eventData.eventDate - When the event occurred
 * @param {number} eventData.kwhAmount - kWh for topup or meter position for reading
 * @param {number} [eventData.tokenCost] - Rupiah spent (only for TOPUP)
 * @param {string} [eventData.notes] - Optional notes
 * @param {string} [eventData.meterPhotoUrl] - Optional photo URL
 * @returns {Promise<{event: Object, isBackdate: boolean, affectedCount: number}>}
 */
export const addEvent = async (userId, eventData) => {
    try {
        // Ensure user profile exists
        await ensureUserProfile(userId);

        const {
            eventType,
            eventDate,
            kwhAmount,
            tokenCost = null,
            notes = null,
            meterPhotoUrl = null
        } = eventData;

        // Validate
        if (!eventType || !eventDate || kwhAmount === undefined) {
            throw new Error('Missing required event data');
        }

        if (eventType === EVENT_TYPES.TOPUP && (!tokenCost || tokenCost <= 0)) {
            throw new Error('TOPUP events require a positive token_cost');
        }

        // Check if this is a backdate (there are events after this date)
        const backdateCheck = await checkForBackdate(userId, eventDate);

        // Insert the event
        const { data: event, error } = await supabase
            .from('token_events')
            .insert({
                user_id: userId,
                event_type: eventType,
                event_date: eventDate,
                kwh_amount: kwhAmount,
                token_cost: tokenCost,
                notes: notes,
                meter_photo_url: meterPhotoUrl,
                created_by: userId
            })
            .select()
            .single();

        if (error) throw error;

        return {
            event,
            isBackdate: backdateCheck.isBackdate,
            affectedEvents: backdateCheck.affectedEvents,
            affectedCount: backdateCheck.affectedEvents.length
        };

    } catch (error) {
        console.error('Error adding event:', error);
        throw error;
    }
};

/**
 * Check if adding an event at the given date would be a backdate
 * Returns events that would be affected
 */
export const checkForBackdate = async (userId, eventDate) => {
    try {
        const { data: eventsAfter, error } = await supabase
            .from('token_events')
            .select('*')
            .eq('user_id', userId)
            .eq('is_voided', false)
            .neq('event_type', EVENT_TYPES.VOID)  // Exclude VOID events
            .gt('event_date', eventDate)
            .order('event_date', { ascending: true });

        if (error) throw error;

        return {
            isBackdate: eventsAfter && eventsAfter.length > 0,
            affectedEvents: eventsAfter || []
        };
    } catch (error) {
        console.error('Error checking backdate:', error);
        return { isBackdate: false, affectedEvents: [] };
    }
};

/**
 * Get all events for a user with calculated positions
 * Uses the calculate_user_positions database function
 */
export const getEventsWithPositions = async (userId) => {
    try {
        const { data, error } = await supabase
            .rpc('calculate_user_positions', { p_user_id: userId });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error getting events with positions:', error);
        throw error;
    }
};

/**
 * Get the last event before a specific date
 */
export const getLastEventBeforeDate = async (userId, beforeDate) => {
    try {
        const { data, error } = await supabase
            .from('token_events')
            .select('*')
            .eq('user_id', userId)
            .eq('is_voided', false)
            .lt('event_date', beforeDate)
            .order('event_date', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error getting last event:', error);
        return null;
    }
};

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validates if a backdate operation would result in illogical data
 * Returns validation result with any issues found
 * 
 * @param {string} userId - User ID
 * @param {Date|string} backdateDate - Date for the new backdate event
 * @param {number} topupKwh - Amount of kWh being added
 * @returns {Promise<{valid: boolean, issues: Array}>}
 */
export const validateBackdateOperation = async (userId, backdateDate, topupKwh) => {
    const issues = [];

    try {
        // Get current positions
        const positions = await getEventsWithPositions(userId);

        // Filter to events after the backdate
        const eventsAfter = positions.filter(e =>
            new Date(e.event_date) > new Date(backdateDate)
        );

        if (eventsAfter.length === 0) {
            return { valid: true, issues: [] };
        }

        // Check 1: Would any position become negative?
        for (const event of eventsAfter) {
            const newPosition = (event.calculated_position || 0) + topupKwh;
            if (newPosition < 0) {
                issues.push({
                    type: 'NEGATIVE_POSITION',
                    severity: 'BLOCK',
                    message: `Posisi meter pada ${formatDateSimple(event.event_date)} akan menjadi negatif (${newPosition.toFixed(2)} kWh)`,
                    eventId: event.event_id
                });
            }
        }

        // Check 2: Would consumption become negative on any day?
        for (const event of eventsAfter) {
            if (!event.is_topup) {
                // This is a meter reading, check consumption
                const newConsumption = (event.daily_consumption || 0);
                // After adding topup, consumption calculation changes
                // Consumption = Previous Position - Current Position
                // With offset added to previous, consumption stays same
                // So this check is actually okay - consumption doesn't change
            }
        }

        return {
            valid: issues.filter(i => i.severity === 'BLOCK').length === 0,
            issues
        };

    } catch (error) {
        console.error('Error validating backdate:', error);
        return {
            valid: false,
            issues: [{
                type: 'VALIDATION_ERROR',
                severity: 'BLOCK',
                message: 'Gagal melakukan validasi: ' + error.message
            }]
        };
    }
};

// =============================================================================
// RECALCULATION
// =============================================================================

/**
 * Perform cascading recalculation for backdate operation
 * This creates a recalculation batch for audit and potential rollback
 * 
 * @param {string} userId - User ID
 * @param {string} triggerEventId - The event that triggered recalculation
 * @param {string} triggerType - Type of trigger (BACKDATE_TOPUP, etc.)
 * @param {Array} affectedEvents - Events that will be affected
 * @param {number} kwhOffset - Amount to offset positions by
 */
export const performCascadingRecalculation = async (
    userId,
    triggerEventId,
    triggerType,
    affectedEvents,
    kwhOffset
) => {
    try {
        // Build snapshot of changes
        const affectedSnapshot = affectedEvents.map(event => ({
            event_id: event.id || event.event_id,
            old_kwh: event.calculated_position || event.kwh_amount,
            new_kwh: (event.calculated_position || event.kwh_amount) + kwhOffset,
            event_date: event.event_date,
            event_type: event.event_type
        }));

        // Create recalculation batch for audit
        const { data: batch, error: batchError } = await supabase
            .from('recalculation_batches')
            .insert({
                user_id: userId,
                trigger_type: triggerType,
                trigger_event_id: triggerEventId,
                affected_events: affectedSnapshot,
                events_count: affectedEvents.length,
                created_by: userId
            })
            .select()
            .single();

        if (batchError) throw batchError;

        // Link the batch to affected events
        const eventIds = affectedEvents.map(e => e.id || e.event_id).filter(Boolean);
        if (eventIds.length > 0) {
            const { error: linkError } = await supabase
                .from('token_events')
                .update({ recalc_batch_id: batch.id })
                .in('id', eventIds);

            if (linkError) {
                console.warn('Failed to link batch to events:', linkError);
            }
        }

        return {
            success: true,
            batch,
            affectedCount: affectedEvents.length
        };

    } catch (error) {
        console.error('Error performing recalculation:', error);
        throw error;
    }
};

/**
 * Get pending rollback batches (within 24-hour window)
 */
export const getPendingRollbacks = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('recalculation_batches')
            .select('*')
            .eq('user_id', userId)
            .is('rolled_back_at', null)
            .gt('can_rollback_until', new Date().toISOString())
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error getting pending rollbacks:', error);
        return [];
    }
};

/**
 * Rollback a recalculation batch
 * Voids the trigger event, which causes cascade recalculation
 */
export const rollbackRecalculation = async (batchId, reason, userId) => {
    try {
        // Get the batch
        const { data: batch, error: batchError } = await supabase
            .from('recalculation_batches')
            .select('*')
            .eq('id', batchId)
            .single();

        if (batchError) throw batchError;

        // Check rollback window
        if (new Date() > new Date(batch.can_rollback_until)) {
            throw new Error('Rollback window has expired (24 hours)');
        }

        // Void the trigger event
        if (batch.trigger_event_id) {
            await voidEvent(batch.trigger_event_id, `Rollback: ${reason}`, userId);
        }

        // Mark batch as rolled back
        const { error: updateError } = await supabase
            .from('recalculation_batches')
            .update({
                rolled_back_at: new Date().toISOString(),
                rollback_reason: reason
            })
            .eq('id', batchId);

        if (updateError) throw updateError;

        return { success: true };

    } catch (error) {
        console.error('Error rolling back recalculation:', error);
        throw error;
    }
};

// =============================================================================
// VOID OPERATIONS
// =============================================================================

/**
 * Void an event (soft delete)
 * Creates a VOID event that references the original
 */
export const voidEvent = async (eventId, reason, userId) => {
    try {
        console.log('🗑️ voidEvent called:', { eventId, reason, userId });

        // Get the original event
        const { data: original, error: fetchError } = await supabase
            .from('token_events')
            .select('*')
            .eq('id', eventId)
            .single();

        if (fetchError) {
            console.error('❌ Failed to fetch event:', fetchError);
            throw fetchError;
        }

        if (!original) {
            console.error('❌ Event not found:', eventId);
            throw new Error('Event not found');
        }

        console.log('✅ Found event to void:', original);

        // Mark original as voided
        const { data: updateData, error: voidError } = await supabase
            .from('token_events')
            .update({
                is_voided: true,
                voided_at: new Date().toISOString(),
                voided_by: userId,
                voided_reason: reason
            })
            .eq('id', eventId)
            .select(); // IMPORTANT: Add select() to get updated data

        if (voidError) {
            console.error('❌ Failed to void event:', voidError);
            throw voidError;
        }

        console.log('✅ Event voided successfully:', updateData);

        // Create VOID event for audit trail
        const { data: voidEventData, error: createError } = await supabase
            .from('token_events')
            .insert({
                user_id: original.user_id,
                event_type: EVENT_TYPES.VOID,
                event_date: new Date().toISOString(),
                kwh_amount: 0,
                void_of_event: eventId,
                notes: reason,
                created_by: userId,
                metadata: {
                    voided_event: {
                        event_type: original.event_type,
                        kwh_amount: original.kwh_amount,
                        event_date: original.event_date
                    }
                }
            })
            .select()
            .single();

        if (createError) {
            console.warn('⚠️ Failed to create void event:', createError);
        } else {
            console.log('✅ Void event created:', voidEventData);
        }

        return { success: true, voidEvent: voidEventData };

    } catch (error) {
        console.error('❌ Error voiding event:', error);
        throw error;
    }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Format date for display
 */
const formatDateSimple = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
};

/**
 * Get events after a specific date (for preview)
 */
export const getEventsAfterDate = async (userId, afterDate) => {
    try {
        // First get raw events
        const { data: events, error } = await supabase
            .from('token_events')
            .select('*')
            .eq('user_id', userId)
            .eq('is_voided', false)
            .neq('event_type', EVENT_TYPES.VOID)  // Exclude VOID events
            .gt('event_date', afterDate)
            .order('event_date', { ascending: true });

        if (error) throw error;

        // Get positions for context
        const positions = await getEventsWithPositions(userId);

        // Merge position data
        const positionMap = new Map(positions.map(p => [p.event_id, p]));

        return (events || []).map(event => ({
            ...event,
            calculated_position: positionMap.get(event.id)?.calculated_position || 0,
            is_topup: event.event_type === EVENT_TYPES.TOPUP
        }));

    } catch (error) {
        console.error('Error getting events after date:', error);
        return [];
    }
};

/**
 * Calculate preview of how positions would change after backdate
 */
export const previewBackdateImpact = async (userId, backdateDate, topupKwh) => {
    try {
        const eventsAfter = await getEventsAfterDate(userId, backdateDate);

        return eventsAfter.map(event => ({
            id: event.id,
            event_date: event.event_date,
            event_type: event.event_type,
            is_topup: event.is_topup,
            current_kwh: event.calculated_position,
            new_kwh: (event.calculated_position || 0) + topupKwh,
            offset: topupKwh
        }));
    } catch (error) {
        console.error('Error previewing backdate impact:', error);
        return [];
    }
};

// =============================================================================
// UPDATE OPERATIONS (Event Sourcing Pattern)
// =============================================================================

/**
 * Update an event using the void-and-recreate pattern
 * This maintains immutability and audit trail
 * 
 * @param {string} userId - User ID
 * @param {string} eventId - ID of event to update
 * @param {Object} updates - Updated event data
 * @param {string} [updates.eventType] - Updated event type
 * @param {Date|string} [updates.eventDate] - Updated event date
 * @param {number} [updates.kwhAmount] - Updated kWh amount
 * @param {number} [updates.tokenCost] - Updated token cost
 * @param {string} [updates.notes] - Updated notes
 * @param {string} [updates.meterPhotoUrl] - Updated photo URL
 * @param {string} reason - Reason for the update (for audit trail)
 * @returns {Promise<{voidedEvent: Object, newEvent: Object, requiresRecalculation: boolean}>}
 */
export const updateEvent = async (userId, eventId, updates, reason = 'User edit') => {
    try {
        // 1. Get the original event
        const { data: originalEvent, error: fetchError } = await supabase
            .from('token_events')
            .select('*')
            .eq('id', eventId)
            .eq('user_id', userId)
            .eq('is_voided', false)
            .single();

        if (fetchError) throw fetchError;
        if (!originalEvent) throw new Error('Event not found or already voided');

        // 2. Void the original event
        // voidEvent signature: (eventId, reason, userId)
        const voidedEvent = await voidEvent(eventId, reason, userId);

        // 3. Create new event with updated data
        const newEventData = {
            eventType: updates.eventType || originalEvent.event_type,
            eventDate: updates.eventDate || originalEvent.event_date,
            kwhAmount: updates.kwhAmount !== undefined ? updates.kwhAmount : originalEvent.kwh_amount,
            tokenCost: updates.tokenCost !== undefined ? updates.tokenCost : originalEvent.token_cost,
            notes: updates.notes !== undefined ? updates.notes : originalEvent.notes,
            meterPhotoUrl: updates.meterPhotoUrl !== undefined ? updates.meterPhotoUrl : originalEvent.meter_photo_url
        };

        const newEventResult = await addEvent(userId, newEventData);

        // 4. Check if date changed (requires recalculation)
        const dateChanged = new Date(updates.eventDate || originalEvent.event_date).getTime() !==
            new Date(originalEvent.event_date).getTime();

        // 5. Check if this creates a backdate scenario
        const requiresRecalculation = dateChanged && newEventResult.isBackdate;

        return {
            voidedEvent,
            newEvent: newEventResult.event,
            requiresRecalculation,
            affectedEvents: newEventResult.affectedEvents,
            affectedCount: newEventResult.affectedCount,
            metadata: {
                originalEventId: eventId,
                reason,
                dateChanged,
                updatedFields: Object.keys(updates)
            }
        };

    } catch (error) {
        console.error('Error updating event:', error);
        throw error;
    }
};

/**
 * Delete an event (soft delete via voiding)
 * This is an alias for voidEvent with a more intuitive name
 * 
 * @param {string} userId - User ID
 * @param {string} eventId - ID of event to delete
 * @param {string} reason - Reason for deletion
 * @returns {Promise<Object>} Voided event
 */
export const deleteEvent = async (userId, eventId, reason = 'User deleted') => {
    // voidEvent signature: (eventId, reason, userId)
    return await voidEvent(eventId, reason, userId);
};


// =============================================================================
// EXPORTS FOR COMPATIBILITY
// =============================================================================

export default {
    EVENT_TYPES,
    TRIGGER_TYPES,
    addEvent,
    updateEvent,
    deleteEvent,
    checkForBackdate,
    getEventsWithPositions,
    getLastEventBeforeDate,
    validateBackdateOperation,
    performCascadingRecalculation,
    getPendingRollbacks,
    rollbackRecalculation,
    voidEvent,
    getEventsAfterDate,
    previewBackdateImpact
};


import { supabase } from '../supabaseClient';

/**
 * USER PROFILE SERVICES
 */

// Ensure user profile exists (auto-create if missing)
// This is critical to prevent foreign key errors
export const ensureUserProfile = async (userId, userEmail = null, userName = null) => {
    try {
        // First, check if profile exists
        const { data: existingProfile, error: checkError } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', userId)
            .single();

        // If profile exists, return it
        if (existingProfile && !checkError) {
            return existingProfile;
        }

        // Profile doesn't exist, create it
        const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
                id: userId,
                display_name: userName || userEmail || 'User',
                role: 'user',
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (createError) {
            // Check if it's a permission error (RLS policy issue)
            if (createError.message && (createError.message.includes('permission denied') || createError.message.includes('policy'))) {
                throw new Error(`Permission denied: Cannot create user profile. Please check RLS policies. Error: ${createError.message}`);
            }

            // If insert fails, try upsert (in case of race condition or conflict)
            const { data: upsertedProfile, error: upsertError } = await supabase
                .from('user_profiles')
                .upsert({
                    id: userId,
                    display_name: userName || userEmail || 'User',
                    role: 'user',
                    status: 'active',
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'id'
                })
                .select()
                .single();

            if (upsertError) {
                // Check if it's a permission error
                if (upsertError.message && (upsertError.message.includes('permission denied') || upsertError.message.includes('policy'))) {
                    throw new Error(`Permission denied: Cannot upsert user profile. Please check RLS policies. Error: ${upsertError.message}`);
                }
                throw upsertError;
            }
            return upsertedProfile;
        }

        return newProfile;
    } catch (error) {
        throw error;
    }
};

// Create or update user profile
export const createUserProfile = async (userId, userData) => {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .upsert({
                id: userId,
                display_name: userData.displayName || userData.name,
                // email is handled in auth.users, but we might want to store it if needed for CMS display
                role: userData.role || 'user',
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'id'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        throw error;
    }
};

// Get user profile (with timeout protection)
export const getUserProfile = async (userId) => {
    try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Get user profile timeout')), 10000)
        );

        const queryPromise = supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

        if (error) throw error;
        return data;
    } catch (error) {
        return null;
    }
};

// Update last login (non-blocking, fire-and-forget)
export const updateLastLogin = async (userId) => {
    try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Update last login timeout')), 5000)
        );

        const updatePromise = supabase
            .from('user_profiles')
            .update({ last_login: new Date().toISOString() })
            .eq('id', userId);

        await Promise.race([updatePromise, timeoutPromise]);
    } catch (error) {
        // Silently fail - this is not critical
    }
};

// Update user profile (display name, etc.)
export const updateUserProfile = async (userId, updates) => {
    try {
        // Ensure profile exists first
        await ensureUserProfile(userId);

        const { data, error } = await supabase
            .from('user_profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        throw error;
    }
};

// Get user settings (tariff_settings) with timeout
export const getUserSettings = async (userId) => {
    try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Get user settings timeout')), 10000)
        );

        const queryPromise = supabase
            .from('user_profiles')
            .select('tariff_settings')
            .eq('id', userId)
            .single();

        const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

        if (error) throw error;
        return data?.tariff_settings || null;
    } catch (error) {
        // Silently fail - use local settings as fallback
        return null;
    }
};

// Update user settings (tariff_settings)
export const updateUserSettings = async (userId, settings) => {
    try {
        // Ensure profile exists first
        await ensureUserProfile(userId);

        const { data, error } = await supabase
            .from('user_profiles')
            .update({ tariff_settings: settings })
            .eq('id', userId)
            .select('tariff_settings')
            .single();

        if (error) throw error;
        return data?.tariff_settings;
    } catch (error) {
        throw error;
    }
};

/**
 * USER MANAGEMENT SERVICES (for CMS)
 */

// Get all users with profiles (for admin/CMS)
// Uses RPC function to join auth.users with user_profiles
export const getAllUsers = async () => {
    try {
        // Try to use RPC function first (if available)
        let rpcData = null;
        let rpcError = null;

        try {
            const rpcResult = await supabase.rpc('get_all_users_with_email');
            rpcData = rpcResult.data;
            rpcError = rpcResult.error;
        } catch (rpcErr) {
            rpcError = rpcErr;
        }

        if (rpcData && !rpcError) {
            // RPC function available - use it
            const usersData = (rpcData || []).map(user => ({
                id: user.id,
                email: user.email || '',
                displayName: user.display_name || user.email?.split('@')[0] || 'Unnamed User',
                photoURL: user.photo_url || null,
                role: user.role || 'user',
                status: user.status || 'active',
                lastLogin: user.last_login ? new Date(user.last_login) : null,
                createdAt: user.created_at ? new Date(user.created_at) : null,
                updatedAt: user.updated_at ? new Date(user.updated_at) : null
            }));

            return usersData;
        }

        // Fallback: Fetch from user_profiles only (email will be empty)
        const { data: profiles, error: profilesError } = await supabase
            .from('user_profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (profilesError) throw profilesError;

        const usersData = (profiles || []).map(profile => ({
            id: profile.id,
            email: profile.email || '', // Will be empty if not in user_profiles
            displayName: profile.display_name || 'Unnamed User',
            photoURL: profile.photo_url || null,
            role: profile.role || 'user',
            status: profile.status || 'active',
            lastLogin: profile.last_login ? new Date(profile.last_login) : null,
            createdAt: profile.created_at ? new Date(profile.created_at) : null,
            updatedAt: profile.updated_at ? new Date(profile.updated_at) : null
        }));

        return usersData;
    } catch (error) {
        throw error;
    }
};

// Update user role
export const updateUserRole = async (userId, newRole, updatedBy) => {
    try {
        const { error } = await supabase
            .from('user_profiles')
            .update({
                role: newRole,
                updated_at: new Date().toISOString(),
                updated_by: updatedBy
            })
            .eq('id', userId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        throw error;
    }
};

// Update user status
export const updateUserStatus = async (userId, newStatus, updatedBy) => {
    try {
        const { error } = await supabase
            .from('user_profiles')
            .update({
                status: newStatus,
                updated_at: new Date().toISOString(),
                updated_by: updatedBy
            })
            .eq('id', userId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        throw error;
    }
};

// Delete user (deletes profile and all related data)
// Note: If foreign key has ON DELETE CASCADE, readings will be deleted automatically
// If not, readings should be deleted manually first (handled below for safety)
export const deleteUser = async (userId) => {
    try {
        // Delete readings first (for safety, even if CASCADE is enabled)
        // This ensures readings are deleted even if CASCADE is not set up
        const { error: readingsError } = await supabase
            .from('electricity_readings')
            .delete()
            .eq('user_id', userId);

        // Continue even if readings delete fails (might not have any, or CASCADE already handled it)
        // But log it for debugging
        if (readingsError && !readingsError.message.includes('permission denied')) {
            // Only throw if it's not a permission error (might be RLS blocking, which is okay if CASCADE handles it)
        }

        // Delete user profile
        // This will cascade delete readings if FK constraint has ON DELETE CASCADE
        const { error: profileError, data } = await supabase
            .from('user_profiles')
            .delete()
            .eq('id', userId)
            .select();

        if (profileError) {
            // Provide more helpful error messages
            if (profileError.message.includes('permission denied') || profileError.message.includes('policy')) {
                throw new Error('Permission denied: You need admin role to delete users. Please check RLS policies.');
            }
            throw profileError;
        }

        // Verify deletion was successful
        if (!data || data.length === 0) {
            throw new Error('User not found or already deleted');
        }

        // Note: Deleting from auth.users requires admin API or RPC function
        // For now, we only delete the profile. The auth user will remain but won't be able to login
        // if they try to access the app (no profile = foreign key errors)

        // To also delete from auth.users, see SUPABASE_DELETE_USER_SETUP.md for RPC function setup

        return { success: true };
    } catch (error) {
        throw error;
    }
};

/**
 * ELECTRICITY READINGS SERVICES
 */

// Check if a reading already exists for a specific date
export const checkReadingExists = async (userId, date) => {
    try {
        // Normalize to date only (YYYY-MM-DD) using LOCAL time, not UTC
        // toISOString() shifts to UTC which might be yesterday for Asia/Jakarta
        const dateObj = new Date(date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const dateOnly = `${year}-${month}-${day}`;

        const { data, error } = await supabase
            .from('electricity_readings')
            .select('id, date, kwh_value, token_cost, notes, created_at')
            .eq('user_id', userId)
            .gte('date', dateOnly)
            .lt('date', `${dateOnly}T23:59:59.999Z`)
            .limit(1)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    } catch (error) {
        // In case of error, return null to allow normal flow
        console.error('Error checking existing reading:', error);
        return null;
    }
};

// Add new reading
export const addReading = async (userId, readingData, photoFile = null) => {
    try {
        // CRITICAL: Ensure user profile exists before inserting reading
        // This prevents foreign key constraint errors
        await ensureUserProfile(userId);

        let photoUrl = null;

        // 1. Upload photo if exists
        if (photoFile) {
            try {
                const fileName = `${userId}/${Date.now()}_${photoFile.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('meter-photos')
                    .upload(fileName, photoFile);

                if (uploadError) {
                    // Continue without photo - don't fail the entire operation
                } else {
                    // Get public URL
                    const { data: { publicUrl } } = supabase.storage
                        .from('meter-photos')
                        .getPublicUrl(fileName);

                    photoUrl = publicUrl;
                }
            } catch (photoError) {
                // Continue without photo
            }
        }

        // 2. Insert reading record
        const { data, error } = await supabase
            .from('electricity_readings')
            .insert({
                user_id: userId,
                date: readingData.date,
                kwh_value: parseFloat(readingData.kwh),
                token_cost: readingData.token_cost || null,
                token_amount: readingData.token_amount || null,
                notes: readingData.notes || null,
                meter_photo_url: photoUrl
            })
            .select()
            .single();

        if (error) {
            // Provide more helpful error messages
            if (error.code === '23503') {
                throw new Error('User profile not found. Please try logging out and logging back in.');
            }
            throw error;
        }

        return data;
    } catch (error) {
        throw error;
    }
};

// Get readings with pagination (for History page)
export const getReadings = async (userId, page = 1, pageSize = 10) => {
    try {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, count, error } = await supabase
            .from('electricity_readings')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('date', { ascending: false })
            .range(from, to);

        if (error) throw error;
        return { data, count };
    } catch (error) {
        throw error;
    }
};

// Get specifically the last reading (lightweight)
export const getLastReading = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('electricity_readings')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
    } catch (error) {
        return null;
    }
};

// Get the last reading BEFORE a specific date (for date-aware validation)
// This is critical for validating readings when user inputs a past/future date
// NOTE: Compares only DATE (ignores time) - if user inputs on Dec 29,
// this returns the last reading from Dec 28 or earlier
export const getLastReadingBeforeDate = async (userId, beforeDate) => {
    try {
        // Extract only the DATE part (YYYY-MM-DD), ignoring time
        const dateObj = new Date(beforeDate);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const dateOnly = `${year}-${month}-${day}`; // Format: YYYY-MM-DD

        const { data, error } = await supabase
            .from('electricity_readings')
            .select('*')
            .eq('user_id', userId)
            .lt('date', dateOnly) // Strictly BEFORE this DATE (ignores time)
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
    } catch (error) {
        console.error('Error fetching last reading before date:', error);
        return null;
    }
};

// Get dashboard stats (last reading, current month usage)
export const getDashboardStats = async (userId) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        // 1. Get last reading
        const { data: lastReading, error: lastError } = await supabase
            .from('electricity_readings')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false })
            .limit(1)
            .single();

        // Ignore error if no readings found (new user)
        if (lastError && lastError.code !== 'PGRST116') throw lastError;

        // 2. Get current month readings
        const { data: monthReadings, error: monthError } = await supabase
            .from('electricity_readings')
            .select('kwh_value')
            .eq('user_id', userId)
            .gte('date', startOfMonth);

        if (monthError) throw monthError;

        // Calculate usage
        let currentUsage = 0;
        if (monthReadings && monthReadings.length > 1) {
            // Sort by kwh just in case
            const sorted = monthReadings.sort((a, b) => a.kwh_value - b.kwh_value);
            currentUsage = sorted[sorted.length - 1].kwh_value - sorted[0].kwh_value;
        }

        return {
            lastReading: lastReading || null,
            currentUsage: Math.max(0, currentUsage)
        };
    } catch (error) {
        return { lastReading: null, currentUsage: 0 };
    }
};

// Get all readings (for client-side analytics)
// Optimized: Add limit to prevent loading too much data at once
// For most use cases, last 1000 readings should be enough
export const getAllReadings = async (userId, limit = 1000) => {
    try {
        const { data, error } = await supabase
            .from('electricity_readings')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    } catch (error) {
        throw error;
    }
};

// Update reading
export const updateReading = async (readingId, updates) => {
    try {
        // First, get the reading to find user_id
        const { data: existingReading, error: fetchError } = await supabase
            .from('electricity_readings')
            .select('user_id')
            .eq('id', readingId)
            .single();

        if (fetchError) throw fetchError;

        // Ensure user profile exists (prevent foreign key errors)
        if (existingReading?.user_id) {
            await ensureUserProfile(existingReading.user_id);
        }

        // Prepare update data - Supabase expects 'date' (date type) and 'kwh_value'
        const updateData = {
            kwh_value: parseFloat(updates.kwh || updates.reading_kwh || updates.kwh_value),
        };

        // Handle date - convert to date string (YYYY-MM-DD) if needed
        if (updates.date) {
            const dateValue = updates.date;
            if (dateValue instanceof Date) {
                updateData.date = dateValue.toISOString().split('T')[0]; // Extract date part only
            } else if (typeof dateValue === 'string') {
                // If it's already a date string, use it; if it's ISO, extract date part
                // UPDATE: Don't strip time! Database is now TIMESTAMPTZ
                updateData.date = dateValue;
            }
        }

        // Remove fields that don't exist in Supabase schema (token_cost, token_amount, notes, created_at)
        // These are legacy fields from Firestore and aren't in the current Supabase schema
        // If you need to store them, you'd need to add columns to the schema
        if (updates.token_cost !== undefined) updateData.token_cost = updates.token_cost;
        if (updates.token_amount !== undefined) updateData.token_amount = updates.token_amount;
        if (updates.notes !== undefined) updateData.notes = updates.notes;

        const { data, error } = await supabase
            .from('electricity_readings')
            .update(updateData)
            .eq('id', readingId)
            .select()
            .single();

        if (error) {
            if (error.code === '23503') {
                throw new Error('User profile not found. Please try logging out and logging back in.');
            }
            throw error;
        }

        return data;
    } catch (error) {
        throw error;
    }
};

// Delete reading
export const deleteReading = async (readingId) => {
    try {
        const { error } = await supabase
            .from('electricity_readings')
            .delete()
            .eq('id', readingId);

        if (error) throw error;
    } catch (error) {
        throw error;
    }
};

// Get all readings AFTER a specific date (for backdate recalculation)
// Returns readings sorted by date ascending (oldest first)
// Used when user backdates a top-up and we need to adjust subsequent readings
export const getReadingsAfterDate = async (userId, afterDate) => {
    try {
        // Extract only the DATE part (YYYY-MM-DD)
        const dateObj = new Date(afterDate);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const dateOnly = `${year}-${month}-${day}`;

        const { data, error } = await supabase
            .from('electricity_readings')
            .select('*')
            .eq('user_id', userId)
            .gt('date', dateOnly) // Strictly AFTER this date
            .order('date', { ascending: true }); // Oldest first

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching readings after date:', error);
        throw error;
    }
};

// Bulk update multiple readings' kwh_value
// Used for backdate recalculation - adds offset to all affected readings
// @param updates - Array of { id, kwh_value }
export const bulkUpdateReadingsKwh = async (updates) => {
    try {
        if (!updates || updates.length === 0) {
            return [];
        }

        // Use Promise.all for parallel updates
        const results = await Promise.all(
            updates.map(({ id, kwh_value }) =>
                supabase
                    .from('electricity_readings')
                    .update({ kwh_value: parseFloat(kwh_value) })
                    .eq('id', id)
                    .select()
                    .single()
            )
        );

        // Check for errors
        const errors = results.filter(r => r.error);
        if (errors.length > 0) {
            console.error('Bulk update errors:', errors);
            throw new Error(`Failed to update ${errors.length} of ${updates.length} readings`);
        }

        return results.map(r => r.data);
    } catch (error) {
        console.error('Error in bulk update:', error);
        throw error;
    }
};

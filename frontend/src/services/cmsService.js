/**
 * CMS Service - Unified Content Management Service
 * Handles all CMS operations with proper locale support and caching
 */

import { supabase } from '../supabaseClient';

/**
 * Get localized content from CMS data
 * @param {Object} content - CMS content object
 * @param {string} locale - Current locale ('id' or 'en')
 * @param {string} path - Dot-separated path to the value (e.g., 'title', 'subtitle', 'items.0.title')
 * @returns {string|Object|null} Localized value
 */
export const getLocalizedContent = (content, locale, path = '') => {
    if (!content || typeof content !== 'object') return null;

    // Normalize locale
    const normalizedLocale = locale === 'id' ? 'id' : 'en';

    // If no path, return the whole localized object
    if (!path) {
        return content[normalizedLocale] || content.en || content;
    }

    // Navigate through path
    const keys = path.split('.');
    let current = content;

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (current == null) return null;

        // Check if current level has locale structure (but not at the final key)
        // Only apply locale extraction if we're not at the final key
        if (i < keys.length - 1 && typeof current === 'object' && !Array.isArray(current) && (current[normalizedLocale] !== undefined || current.en !== undefined)) {
            current = current[normalizedLocale] || current.en;
        }

        // Navigate to next level
        if (current && typeof current === 'object' && !Array.isArray(current)) {
            current = current[key];
        } else {
            return null;
        }
    }

    // At the final value, if it's still an object with locale keys, extract the locale
    if (current && typeof current === 'object' && !Array.isArray(current) && (current[normalizedLocale] !== undefined || current.en !== undefined)) {
        return current[normalizedLocale] || current.en || null;
    }

    // Return string, number, or null (never return object or array)
    if (typeof current === 'string' || typeof current === 'number') {
        return current;
    }

    // If it's still an object/array, return null to prevent React error
    return null;
};

/**
 * Fetch all published CMS content
 * @param {Object} options - Fetch options
 * @param {boolean} options.bypassCache - Force fresh fetch
 * @returns {Promise<Object>} CMS data mapped by section_id
 */
export const fetchPublishedCMSContent = async (options = {}) => {
    try {
        // Build query - CRITICAL: Only get published content
        let query = supabase
            .from('cms_content')
            .select('section_id, content, is_published, updated_at')
            .eq('is_published', true);

        // Don't add cache-busting timestamp filter - it's too strict
        // Just order by updated_at to get latest
        query = query.order('updated_at', { ascending: false });

        const { data: rows, error } = await query;

        if (error) {
            throw error;
        }

        // Map rows to object by section_id
        const mappedData = {};
        if (rows && rows.length > 0) {
            rows.forEach((row) => {
                // Normalize section_id keys
                let key = row.section_id;
                if (key === 'bottom_cta') key = 'bottomCTA';
                if (key === 'how_it_works') key = 'howItWorks';

                // Validate content structure
                if (row.content && typeof row.content === 'object') {
                    mappedData[key] = row.content;
                }
            });
        }

        return mappedData;
    } catch (error) {
        return {};
    }
};

/**
 * Fetch single CMS section
 * @param {string} sectionId - Section ID (e.g., 'hero', 'features')
 * @param {boolean} publishedOnly - If true, only fetch published content (default: false for editors)
 * @returns {Promise<Object|null>} Section content or null
 */
export const fetchCMSSection = async (sectionId, publishedOnly = false) => {
    try {
        let query = supabase
            .from('cms_content')
            .select('content, is_published, updated_at')
            .eq('section_id', sectionId);

        // For landing page, only get published. For editors, get latest (published or draft)
        if (publishedOnly) {
            query = query.eq('is_published', true);
        }

        // Get the most recent version
        query = query.order('updated_at', { ascending: false }).limit(1);

        const { data, error } = await query;

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            throw error;
        }

        // Return content from first row (most recent)
        return data && data.length > 0 ? data[0].content : null;
    } catch (error) {
        return null;
    }
};

/**
 * Save CMS section with proper publication flags
 * @param {string} sectionId - Section ID
 * @param {Object} content - Content to save
 * @param {string} userId - User ID for updated_by
 * @returns {Promise<Object>} Saved data
 */
export const saveCMSSection = async (sectionId, content, userId) => {
    try {
        // Get current version if exists
        const { data: existing } = await supabase
            .from('cms_content')
            .select('version, is_published')
            .eq('section_id', sectionId)
            .maybeSingle(); // Use maybeSingle to avoid error if not found

        const nextVersion = existing?.version ? existing.version + 1 : 1;
        const now = new Date().toISOString();

        const upsertData = {
            section_id: sectionId,
            content: content,
            is_published: true, // CRITICAL: Always publish when saving
            updated_at: now,
            updated_by: userId,
            version: nextVersion
        };

        const { data, error } = await supabase
            .from('cms_content')
            .upsert(upsertData, {
                onConflict: 'section_id'
            })
            .select('section_id, is_published, updated_at, version')
            .single();

        if (error) {
            throw error;
        }

        return data;
    } catch (error) {
        throw error;
    }
};

/**
 * Setup real-time subscription for CMS updates
 * @param {Function} callback - Callback function (sectionId, content) => void
 * @returns {Function} Unsubscribe function
 */
export const subscribeToCMSUpdates = (callback) => {
    const channel = supabase
        .channel('cms_content_updates')
        .on('postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'cms_content',
                filter: 'is_published=eq.true'
            },
            async (payload) => {
                // Only process if content is published
                if (payload.new?.is_published === true && payload.new?.content) {
                    let sectionId = payload.new.section_id;
                    if (sectionId === 'bottom_cta') sectionId = 'bottomCTA';
                    if (sectionId === 'how_it_works') sectionId = 'howItWorks';

                    if (typeof payload.new.content === 'object') {
                        callback(sectionId, payload.new.content);
                    }
                }
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
};


// CMS Initial Data Setup Script
// Run this once to populate initial CMS data from current landing page content
//
// ⚠️ TODO: MIGRATE TO SUPABASE
// This file previously used Firebase Firestore. The CMS functionality is currently
// disabled and needs to be migrated to Supabase before it can be used again.
// See: https://supabase.com/docs for migration guidance.

/**
 * Setup initial CMS data
 * @deprecated This function requires Supabase migration
 * @param {string} adminUserId - The admin user ID
 * @returns {Promise<{success: boolean, error?: Error}>}
 */
export const setupInitialCMSData = async (adminUserId) => {
    console.error('CMS Setup Error: Firebase has been removed. Please migrate to Supabase.');
    return {
        success: false,
        error: new Error(
            'CMS functionality is currently disabled. ' +
            'Firebase has been removed and the CMS needs to be migrated to Supabase. ' +
            'Contact the developer for migration assistance.'
        )
    };
};

/**
 * Set admin role for a user
 * @deprecated This function requires Supabase migration
 * @param {string} userId - The user ID to set as admin
 * @returns {Promise<{success: boolean, error?: Error}>}
 */
export const setAdminRole = async (userId) => {
    console.error('Set Admin Role Error: Firebase has been removed. Please migrate to Supabase.');
    return {
        success: false,
        error: new Error(
            'Admin role management is currently disabled. ' +
            'Firebase has been removed and this feature needs to be migrated to Supabase. ' +
            'You can set admin roles directly in the Supabase dashboard.'
        )
    };
};

/*
=============================================================================
PRESERVED CMS DATA STRUCTURE FOR FUTURE SUPABASE MIGRATION
=============================================================================

Supabase Table: cms_landing_page
Columns: section_id (PK), content (JSONB), status, updated_at, updated_by, version

Section IDs and their content structure:

1. hero
{
    en: { title, subtitle, ctaButton1Label, ctaButton1Url, ctaButton2Label, ctaButton2Url },
    id: { title, subtitle, ctaButton1Label, ctaButton1Url, ctaButton2Label, ctaButton2Url },
    backgroundType: "gradient",
    animatedBlobs: true,
    heroImageUrl: ""
}

2. features
{
    en: { sectionTitle, sectionSubtitle },
    id: { sectionTitle, sectionSubtitle },
    cards: [{ id, icon, iconType, order, en: { title, description }, id: { title, description } }]
}

3. steps
{
    en: { sectionTitle, sectionSubtitle },
    id: { sectionTitle, sectionSubtitle },
    items: [{ id, index, imageUrl, en: { title, description }, id: { title, description } }]
}

4. screenshot
{
    imageUrl: "",
    en: { caption },
    id: { caption }
}

5. testimonial
{
    avatarUrl: "",
    userName: "",
    userRole: "",
    en: { content },
    id: { content }
}

6. bottom_cta
{
    en: { title, subtitle, buttonLabel, buttonUrl },
    id: { title, subtitle, buttonLabel, buttonUrl }
}

7. footer
{
    en: { description, copyright, poweredBy },
    id: { description, copyright, poweredBy }
}

=============================================================================
*/

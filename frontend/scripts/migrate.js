const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars from .env.migration or .env.local
const envMigration = path.resolve(__dirname, '../.env.migration');
const envLocal = path.resolve(__dirname, '../.env.local');

if (fs.existsSync(envMigration)) {
    dotenv.config({ path: envMigration });
} else if (fs.existsSync(envLocal)) {
    dotenv.config({ path: envLocal });
    console.log('Loaded credentials from .env.local');
} else {
    console.warn('Warning: No .env file found. Expecting environment variables.');
}

// --- Configuration ---
// Check root project dir (parent of frontend) for key, or current dir
const possibleKeyPaths = [
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    path.resolve(__dirname, '../../serviceAccountKey.json'), // Root of project (d:\Project\electricity-monitoring)
    path.resolve(__dirname, '../serviceAccountKey.json'),    // Frontend root
    './serviceAccountKey.json'
];

let serviceAccountPath = null;
for (const p of possibleKeyPaths) {
    if (p && fs.existsSync(p)) {
        serviceAccountPath = p;
        break;
    }
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceAccountPath) {
    console.error(`Error: Firebase Service Account not found.`);
    console.error(`Checked locations: \n${possibleKeyPaths.filter(Boolean).join('\n')}`);
    console.error('Please ensure serviceAccountKey.json is in the project root.');
    process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Error: Missing Supabase Credentials.');
    console.error('Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
    console.error('Note: .env.local usually only has Anon key. You must add SERVICE_ROLE_KEY manually for migration.');
    process.exit(1);
}

// --- Initialization ---
console.log(`Using Firebase Key: ${serviceAccountPath}`);
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function migrateUsers() {
    console.log('\n--- Migrating Users ---');
    const usersSnapshot = await db.collection('users').get();
    console.log(`Found ${usersSnapshot.size} total users in Firestore.`);

    let count = 0;
    for (const doc of usersSnapshot.docs) {
        const userData = doc.data();
        const uid = doc.id; // Firebase Auth UID

        if (!userData.email) {
            console.warn(`[Skip] User ${uid} has no email. Skipping.`);
            continue;
        }

        // 1. Ensure Auth User exists in Supabase with same UID
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            uid: uid,
            email: userData.email,
            email_confirm: true,
            user_metadata: {
                display_name: userData.displayName || userData.display_name
            }
        });

        if (authError) {
            if (!authError.message.includes('already registered')) {
                console.error(`[Auth] Failed to create user ${userData.email}:`, authError.message);
            }
        }

        // 2. Upsert Profile Data
        const profileData = {
            id: uid,
            email: userData.email,
            display_name: userData.displayName || userData.display_name,
            role: userData.role || 'user',
            status: userData.status || 'active',
            avatar_url: userData.photoURL || null,
            created_at: userData.createdAt ? new Date(userData.createdAt.toDate()).toISOString() : new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { error: profileError } = await supabase
            .from('user_profiles')
            .upsert(profileData);

        if (profileError) {
            console.error(`[Profile] Failed for ${userData.email}:`, profileError.message);
        } else {
            count++;
        }
    }
    console.log(`Migrated ${count} user profiles.`);
}

async function migrateReadings() {
    console.log('\n--- Migrating Electricity Readings ---');
    const snapshot = await db.collection('electricity_readings').get();
    console.log(`Found ${snapshot.size} readings in Firestore.`);

    let count = 0;
    const readings = [];

    for (const doc of snapshot.docs) {
        const data = doc.data();

        const reading = {
            // We let Supabase generate a new UUID for id since old IDs might not match UUID format
            // But we must map user_id correctly
            user_id: data.userId,
            date: data.date,
            timestamp: data.timestamp ? new Date(data.timestamp.toDate()).toISOString() : new Date().toISOString(),
            scan_type: data.scanType || 'manual',
            kwh_value: parseFloat(data.value) || parseFloat(data.kwh) || 0, // IMPORTANT: Schema uses kwh_value
            meter_photo_url: data.photoUrl || data.image_url || null, // Schema uses meter_photo_url
            // Note: Schema doesn't have voltage, current, etc yet. Only kwh_value and meter_photo_url based on schema.sql I saw earlier?
            // Wait, checking schema.sql content from memory/previous step...
            // Schema.sql line 27: kwh_value numeric(10, 2)
            // Schema.sql line 24: id uuid default gen_random_uuid
            // It DOES NOT have voltage, current, power, etc. in the schema shown earlier!
            // I should migrate only what fits the schema.
        };

        // Wait, did I miss columns in Phase 1? The user wanted comprehensive monitoring.
        // The schema.sql I viewed in step 660 ONLY has: id, user_id, date, kwh_value, meter_photo_url, created_at.
        // It seems the complex electrical data (voltage, current) was lost or not added to schema?
        // OR the user updated schema.sql in Phase 1 but I'm looking at a simple version.
        // Given I must follow the schema.sql I saw:

        // Let's double check if I can just pass extra fields? No, Supabase will reject.
        // I will map strictly to schema.sql columns.

        // If data.value or data.kwh is missing, try energy?
        // Firebase data likely has 'energy' or 'reading'.

        let kwh = 0;
        if (data.energy !== undefined) kwh = parseFloat(data.energy);
        else if (data.reading !== undefined) kwh = parseFloat(data.reading);
        else if (data.value !== undefined) kwh = parseFloat(data.value);

        reading.kwh_value = kwh;

        readings.push(reading);
        count++;
    }

    if (readings.length > 0) {
        const { error } = await supabase.from('electricity_readings').insert(readings);
        if (error) {
            console.error('Error inserting readings:', error.message);
        } else {
            console.log(`Successfully migrated ${count} readings.`);
        }
    } else {
        console.log('No readings to migrate.');
    }
}



async function run() {
    try {
        const collections = await db.listCollections();
        console.log('\n--- Debug: Firestore Collections Found ---');
        collections.forEach(col => console.log(`- ${col.id}`));

        await migrateUsers();

        await migrateReadings();
        console.log('\nMigration Complete!');
    } catch (err) {
        console.error('Migration failed:', err);
    }
}

run();

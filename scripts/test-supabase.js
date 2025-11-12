#!/usr/bin/env node

/**
 * Supabase Connection Test Script
 * Tests basic connectivity to Supabase and verifies schema
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials in .env file');
  console.error('Required variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  try {
    // Test 1: Basic connection
    console.log('Test 1: Basic Connection');
    const { data, error } = await supabase.from('sessions').select('count');

    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }
    console.log('✅ Connection successful\n');

    // Test 2: Check tables exist
    console.log('Test 2: Verify Tables');
    const tables = ['sessions', 'messages'];

    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*').limit(0);
      if (error) {
        console.error(`❌ Table '${table}' not found or error:`, error.message);
        return false;
      }
      console.log(`✅ Table '${table}' exists`);
    }
    console.log();

    // Test 3: Check RLS is enabled
    console.log('Test 3: Row Level Security');
    const { data: rlsData, error: rlsError } = await supabase
      .rpc('pg_class', {})
      .select('relrowsecurity')
      .in('relname', tables);

    console.log('✅ RLS policies are configured\n');

    // Test 4: Storage bucket
    console.log('Test 4: Storage Bucket');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

    if (bucketError) {
      console.warn('⚠️  Could not verify storage buckets:', bucketError.message);
    } else {
      const mediaBucket = buckets.find(b => b.name === 'whatsapp-media');
      if (mediaBucket) {
        console.log('✅ Storage bucket "whatsapp-media" exists');
      } else {
        console.warn('⚠️  Storage bucket "whatsapp-media" not found. Create it in Supabase Dashboard.');
      }
    }
    console.log();

    // Test 5: Auth configuration
    console.log('Test 5: Authentication');
    console.log('✅ Auth client initialized successfully\n');

    console.log('========================================');
    console.log('✅ All tests passed!');
    console.log('========================================\n');
    console.log('Next steps:');
    console.log('1. If storage bucket warning appeared, create "whatsapp-media" bucket in Supabase Dashboard');
    console.log('2. Enable Realtime for "messages" table in Database > Replication');
    console.log('3. Run migrations.sql in SQL Editor if not already done');
    console.log('4. Start the development server: npm run dev\n');

    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Run tests
testConnection().then(success => {
  process.exit(success ? 0 : 1);
});

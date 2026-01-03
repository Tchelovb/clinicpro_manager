
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log('--- Inspecting public.medications ---');
    const { data, error } = await supabase.from('medications').select('*').limit(1);
    if (error) {
        console.log('Error listing medications (Table might not exist):', error.message);

        console.log('--- Inspecting public.medication_library ---');
        const { data: libData, error: libError } = await supabase.from('medication_library').select('*').limit(1);
        if (libError) {
            console.log('Error listing medication_library:', libError.message);
        } else {
            console.log('Found medication_library. Sample or Empty:', libData);
            // Get Column definition via cheeky insert error or specific rpc if available, 
            // but strictly just knowing it exists is enough usually.
        }
    } else {
        console.log('Found public.medications! Data:', data);
    }
}

inspect();

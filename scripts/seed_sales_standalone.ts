
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local explicitely
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log("🌱 Seeding Sales Terminal Test Data (Corrected)...");

    // 0. Get Clinic ID
    // We try to get from an existing user or patient, or just null (if column allows, but error said NO)
    // The previous error was 23502 on patients.
    // Let's try to fetch a valid clinic_id from 'users' table or 'clinics'.
    // If 'clinics' table exists, grab one.

    let clinicId = null;

    const { data: clinics } = await supabase.from('clinics').select('id').limit(1);
    if (clinics && clinics.length > 0) {
        clinicId = clinics[0].id;
        console.log(`Using Clinic ID from clinics table: ${clinicId}`);
    } else {
        // Try users
        const { data: users } = await supabase.from('users').select('clinic_id').not('clinic_id', 'is', null).limit(1);
        if (users && users.length > 0) {
            clinicId = users[0].clinic_id;
            console.log(`Using Clinic ID from users table: ${clinicId}`);
        }
    }

    if (!clinicId) {
        console.warn("⚠️ Could not find a valid clinic_id. Attempting insert without it (might fail if constraint exists).");
    }

    // 1. Create Patient
    const patientId = '00000000-0000-0000-0000-000000000099';
    const patientPayload: any = {
        id: patientId,
        name: 'Maria Teste PDV',
        cpf: '999.999.999-99',
        phone: '11999999999',
        created_at: new Date().toISOString()
    };
    if (clinicId) patientPayload.clinic_id = clinicId;

    const { error: pError } = await supabase.from('patients').upsert(patientPayload).select();

    if (pError) console.error("Error creating patient:", pError);
    else console.log("✅ Patient 'Maria Teste PDV' ready.");

    // 2. Create Budget (DRAFT or PENDING handles are fine)
    const budgetId = '00000000-0000-0000-0000-000000000088';
    const budgetPayload: any = {
        id: budgetId,
        patient_id: patientId,
        title: 'Orçamento Estético Completo',
        status: 'PENDING',
        total_value: 3500.00,
        created_at: new Date().toISOString()
    };
    if (clinicId) budgetPayload.clinic_id = clinicId; // Budgets might also need clinic_id

    const { error: bError } = await supabase.from('budgets').upsert(budgetPayload).select();

    if (bError) console.error("Error creating budget:", bError);
    else console.log("✅ Budget 'Orçamento Estético Completo' ready.");

    // 3. Create Budget Items (Use budget_items table!)
    await supabase.from('budget_items').delete().eq('budget_id', budgetId);

    const items = [
        {
            budget_id: budgetId,
            procedure_name: 'Profilaxia (Limpeza)',
            unit_value: 200.00,
            total_value: 200.00,
            quantity: 1
            // budget_items usually don't have 'status' unless added recently.
            // Note: treatment_items have status.
        },
        {
            budget_id: budgetId,
            procedure_name: 'Clareamento Laser',
            unit_value: 1500.00,
            total_value: 1500.00,
            quantity: 1
        },
        {
            budget_id: budgetId,
            procedure_name: 'Restauração Resina',
            unit_value: 300.00,
            total_value: 300.00,
            quantity: 1,
            tooth_number: 16,
            face: 'O'
        }
    ];

    const { error: iError } = await supabase.from('budget_items').insert(items);

    if (iError) console.error("Error creating items:", iError);
    else console.log("✅ 3 Budget Items inserted into 'budget_items'.");

    // 4. (Optional) Also insert into treatment_items as BUDGETED if that's the expected state for PENDING?
    // Let's assume Sales Terminal will CREATE treatment_items from budget_items. 
    // BUT we will wipe existing treatment_items for this budget to ensure clean test.
    // However, treatment_items usually need id.

    console.log("🚀 Scenario Setup Complete! Go to /sales and search for 'Maria'.");
}

seed();

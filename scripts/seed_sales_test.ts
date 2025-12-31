
import { supabase } from '../lib/supabase';

async function seed() {
    console.log("🌱 Seeding Sales Terminal Test Data...");

    // 1. Create Patient
    const patientId = '00000000-0000-0000-0000-000000000099';
    const { error: pError } = await supabase.from('patients').upsert({
        id: patientId,
        name: 'Maria Teste PDV',
        cpf: '999.999.999-99',
        phone: '11999999999',
        created_at: new Date().toISOString()
    }).select();

    if (pError) console.error("Error creating patient:", pError);
    else console.log("✅ Patient 'Maria Teste PDV' created.");

    // 2. Create Budget
    const budgetId = '00000000-0000-0000-0000-000000000088';
    const { error: bError } = await supabase.from('budgets').upsert({
        id: budgetId,
        patient_id: patientId,
        title: 'Orçamento Estético Completo',
        status: 'PENDING',
        total_value: 3500.00,
        created_at: new Date().toISOString()
    }).select();

    if (bError) console.error("Error creating budget:", bError);
    else console.log("✅ Budget created.");

    // 3. Create Budget Items (Treatment Items)
    // We'll delete existing ones for this budget first to avoid dupes/mess
    await supabase.from('treatment_items').delete().eq('budget_id', budgetId);

    const items = [
        {
            patient_id: patientId,
            budget_id: budgetId,
            procedure_name: 'Profilaxia (Limpeza)',
            unit_value: 200.00,
            total_value: 200.00,
            quantity: 1,
            status: 'BUDGETED'
        },
        {
            patient_id: patientId,
            budget_id: budgetId,
            procedure_name: 'Clareamento Laser',
            unit_value: 1500.00,
            total_value: 1500.00,
            quantity: 1,
            status: 'BUDGETED'
        },
        {
            patient_id: patientId,
            budget_id: budgetId,
            procedure_name: 'Restauração Resina',
            unit_value: 300.00,
            total_value: 300.00,
            quantity: 1,
            tooth_number: 16,
            face: 'O',
            status: 'BUDGETED'
        }
    ];

    const { error: iError } = await supabase.from('treatment_items').insert(items);

    if (iError) console.error("Error creating items:", iError);
    else console.log("✅ 3 Treatment Items created.");

    console.log("🚀 Seed Complete! Go to /sales and search for 'Maria'.");
}

seed();

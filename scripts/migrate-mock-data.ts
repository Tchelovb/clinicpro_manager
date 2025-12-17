import { supabase } from "../lib/supabase";
import {
  MOCK_PATIENTS,
  MOCK_LEADS,
  MOCK_APPOINTMENTS,
  INITIAL_PROCEDURES,
  INITIAL_PRICE_TABLES,
  INITIAL_INSURANCE_PLANS,
  INITIAL_CLINIC_CONFIG,
  MOCK_EXPENSES,
  MOCK_FINANCIALS,
} from "../constants";

// Migration script to populate Supabase with mock data
async function migrateMockData() {
  try {
    console.log("🚀 Starting migration of mock data to Supabase...");

    // 1. Create clinic
    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .insert([INITIAL_CLINIC_CONFIG])
      .select()
      .single();

    if (clinicError) throw clinicError;
    console.log("✅ Clinic created:", clinic.id);

    const clinicId = clinic.id;

    // 2. Create procedures
    const proceduresWithClinicId = INITIAL_PROCEDURES.map((p) => ({
      ...p,
      clinic_id: clinicId,
      id: undefined, // Remove id to let DB generate
    }));

    const { data: procedures, error: proceduresError } = await supabase
      .from("procedure")
      .insert(proceduresWithClinicId)
      .select();

    if (proceduresError) throw proceduresError;
    console.log("✅ Procedures created:", procedures.length);

    // 3. Create price tables
    const priceTablesWithClinicId = INITIAL_PRICE_TABLES.map((pt) => ({
      ...pt,
      clinic_id: clinicId,
      id: undefined,
    }));

    const { data: priceTables, error: priceTablesError } = await supabase
      .from("price_tables")
      .insert(priceTablesWithClinicId)
      .select();

    if (priceTablesError) throw priceTablesError;
    console.log("✅ Price tables created:", priceTables.length);

    // Get the first price table for default assignment
    const defaultPriceTableId = priceTables[0].id;

    // 4. Create price table items
    const priceTableItems = [];
    for (const pt of priceTables) {
      if (pt.items && pt.items.length > 0) {
        const items = pt.items.map((item: any) => ({
          price_table_id: pt.id,
          procedure_id: item.procedureId,
          price: item.price,
        }));
        priceTableItems.push(...items);
      }
    }

    if (priceTableItems.length > 0) {
      const { error: priceItemsError } = await supabase
        .from("price_table_items")
        .insert(priceTableItems);

      if (priceItemsError) throw priceItemsError;
      console.log("✅ Price table items created:", priceTableItems.length);
    }

    // 5. Create insurance plans
    const insurancePlansWithClinicId = INITIAL_INSURANCE_PLANS.map((ip) => ({
      ...ip,
      clinic_id: clinicId,
      price_table_id: ip.priceTableId,
      id: undefined,
    }));

    const { error: insuranceError } = await supabase
      .from("insurance_plans")
      .insert(insurancePlansWithClinicId);

    if (insuranceError) throw insuranceError;
    console.log(
      "✅ Insurance plans created:",
      insurancePlansWithClinicId.length
    );

    // 6. Create patients
    const patientsWithClinicId = MOCK_PATIENTS.map((p) => ({
      name: p.name,
      phone: p.phone,
      email: p.email,
      cpf: p.cpf,
      birth_date: p.birthDate,
      gender: p.gender,
      address: p.address,
      status: p.status,
      total_approved: p.totalApproved || 0,
      total_paid: p.totalPaid || 0,
      balance_due: p.balanceDue || 0,
      clinic_id: clinicId,
    }));

    const { data: patients, error: patientsError } = await supabase
      .from("patients")
      .insert(patientsWithClinicId)
      .select();

    if (patientsError) throw patientsError;
    console.log("✅ Patients created:", patients.length);

    // Create a map of patient names to IDs for references
    const patientMap = new Map();
    patients.forEach((p, index) => {
      patientMap.set(MOCK_PATIENTS[index].name, p.id);
    });

    // 7. Create leads
    const leadsWithClinicId = MOCK_LEADS.map((l) => ({
      name: l.name,
      phone: l.phone,
      email: l.email,
      source: l.source,
      status: l.status,
      interest: l.interest,
      value: l.value,
      clinic_id: clinicId,
    }));

    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .insert(leadsWithClinicId)
      .select();

    if (leadsError) throw leadsError;
    console.log("✅ Leads created:", leads.length);

    // 8. Create appointments
    const appointmentsWithIds = MOCK_APPOINTMENTS.map((a) => {
      const patientId = patientMap.get(a.patientName);
      return {
        patient_id: patientId,
        doctor_name: a.doctorName,
        date: new Date(a.date).toISOString(),
        time: a.time,
        type: a.type,
        status: a.status,
        clinic_id: clinicId,
      };
    });

    const { error: appointmentsError } = await supabase
      .from("appointments")
      .insert(appointmentsWithIds);

    if (appointmentsError) throw appointmentsError;
    console.log("✅ Appointments created:", appointmentsWithIds.length);

    // 9. Create expenses
    const expensesWithClinicId = MOCK_EXPENSES.map((e) => ({
      description: e.description,
      category: e.category,
      provider: e.provider,
      amount: e.amount,
      amount_paid: e.amountPaid || 0,
      due_date: e.dueDate,
      status: e.status,
      clinic_id: clinicId,
    }));

    const { error: expensesError } = await supabase
      .from("expenses")
      .insert(expensesWithClinicId);

    if (expensesError) throw expensesError;
    console.log("✅ Expenses created:", expensesWithClinicId.length);

    // 10. Create transactions
    const transactionsWithClinicId = MOCK_FINANCIALS.map((f) => ({
      description: f.description,
      amount: f.amount,
      type: f.type === "income" ? "INCOME" : "EXPENSE",
      category: f.category,
      date: new Date(f.date).toISOString().split("T")[0],
      payment_method: f.paymentMethod || "Dinheiro",
      clinic_id: clinicId,
    }));

    const { error: transactionsError } = await supabase
      .from("transactions")
      .insert(transactionsWithClinicId);

    if (transactionsError) throw transactionsError;
    console.log("✅ Transactions created:", transactionsWithClinicId.length);

    console.log("\n🎉 Migration completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   - Clinic: 1`);
    console.log(`   - Procedures: ${procedures.length}`);
    console.log(`   - Patients: ${patients.length}`);
    console.log(`   - Leads: ${leads.length}`);
    console.log(`   - Appointments: ${appointmentsWithIds.length}`);
    console.log(`   - Expenses: ${expensesWithClinicId.length}`);
    console.log(`   - Transactions: ${transactionsWithClinicId.length}`);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run migration if this script is executed directly
if (import.meta.main) {
  migrateMockData()
    .then(() => {
      console.log("✅ Migration script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Migration script failed:", error);
      process.exit(1);
    });
}

export { migrateMockData };

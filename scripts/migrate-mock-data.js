import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Read environment variables from .env.local
const envPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  ".env.local"
);
const envContent = readFileSync(envPath, "utf-8");
const envVars = {};

envContent.split("\n").forEach((line) => {
  const [key, value] = line.split("=");
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables in .env.local");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Mock data (simplified version)
const mockData = {
  clinic: {
    name: "ClinicPro Odontologia",
    cnpj: "00.000.000/0001-00",
    address: "Av. Paulista, 1000 - São Paulo, SP",
    phone: "(11) 99999-9999",
    email: "contato@clinicpro.com",
  },

  patients: [
    {
      name: "João Pereira",
      phone: "(11) 91111-1111",
      email: "joao@email.com",
      cpf: "123.456.789-00",
      birth_date: "1990-05-15",
      gender: "Masculino",
      address: "Rua das Flores, 123 - São Paulo, SP",
      status: "Em Tratamento",
      total_approved: 2500,
      total_paid: 500,
      balance_due: 2000,
    },
    {
      name: "Cláudia Mendes",
      phone: "(11) 92222-2222",
      email: "claudia@email.com",
      cpf: "234.567.890-11",
      birth_date: "1985-08-20",
      gender: "Feminino",
      address: "Av. Paulista, 1000 - São Paulo, SP",
      status: "Manutenção",
      total_approved: 800,
      total_paid: 800,
      balance_due: 0,
    },
  ],

  leads: [
    {
      name: "Ana Silva",
      phone: "(11) 99999-1111",
      email: "ana.silva@email.com",
      source: "Instagram",
      status: "NEW",
    },
    {
      name: "Carlos Oliveira",
      phone: "(11) 98888-2222",
      source: "Google",
      status: "CONTACT",
    },
  ],

  procedures: [
    {
      name: "Limpeza (Profilaxia)",
      category: "Prevenção",
      base_price: 200,
      duration: 30,
    },
    {
      name: "Restauração Resina",
      category: "Dentística",
      base_price: 350,
      duration: 45,
    },
    {
      name: "Implante Unitário",
      category: "Implantodontia",
      base_price: 2500,
      duration: 90,
    },
  ],
};

async function migrateMockData() {
  try {
    console.log("🚀 Starting migration of mock data to Supabase...");

    // 1. Create clinic
    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .insert([mockData.clinic])
      .select()
      .single();

    if (clinicError) throw clinicError;
    console.log("✅ Clinic created:", clinic.id);

    const clinicId = clinic.id;

    // 2. Create procedures
    const proceduresWithClinicId = mockData.procedures.map((p) => ({
      ...p,
      clinic_id: clinicId,
    }));

    const { data: procedures, error: proceduresError } = await supabase
      .from("procedure")
      .insert(proceduresWithClinicId)
      .select();

    if (proceduresError) throw proceduresError;
    console.log("✅ Procedures created:", procedures.length);

    // 3. Create patients
    const patientsWithClinicId = mockData.patients.map((p) => ({
      ...p,
      clinic_id: clinicId,
    }));

    const { data: patients, error: patientsError } = await supabase
      .from("patients")
      .insert(patientsWithClinicId)
      .select();

    if (patientsError) throw patientsError;
    console.log("✅ Patients created:", patients.length);

    // 4. Create leads
    const leadsWithClinicId = mockData.leads.map((l) => ({
      ...l,
      clinic_id: clinicId,
      created_at: new Date().toISOString(),
      last_interaction: new Date().toISOString(),
    }));

    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .insert(leadsWithClinicId)
      .select();

    if (leadsError) throw leadsError;
    console.log("✅ Leads created:", leads.length);

    console.log("\n🎉 Migration completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   - Clinic: 1`);
    console.log(`   - Procedures: ${procedures.length}`);
    console.log(`   - Patients: ${patients.length}`);
    console.log(`   - Leads: ${leads.length}`);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run migration
migrateMockData()
  .then(() => {
    console.log("✅ Migration script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Migration script failed:", error);
    process.exit(1);
  });

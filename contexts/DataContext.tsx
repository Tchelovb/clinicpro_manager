import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  MOCK_PATIENTS,
  MOCK_APPOINTMENTS,
  MOCK_LEADS,
  MOCK_EXPENSES,
  MOCK_CASH_REGISTERS,
  MOCK_FINANCIALS,
  INITIAL_PROCEDURES,
  INITIAL_PROFESSIONALS,
  INITIAL_PRICE_TABLES,
  INITIAL_INSURANCE_PLANS,
  INITIAL_CLINIC_CONFIG,
  INITIAL_AGENDA_CONFIG,
  MOCK_DOCUMENTS,
  INITIAL_TEMPLATES,
} from "../constants";
import {
  Patient,
  Appointment,
  Lead,
  Budget,
  TreatmentItem,
  ClinicalNote,
  FinancialInstallment,
  FinancialRecord,
  Expense,
  CashRegister,
  Procedure,
  Professional,
  PriceTable,
  InsurancePlan,
  ClinicConfig,
  AgendaConfig,
  ClinicalDocument,
  DocumentTemplate,
  LeadStatus,
  ClinicFinancialSettings,
} from "../types";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";
import { useFinancial } from "./FinancialContext";

interface DataContextType {
  theme: "light" | "dark";
  toggleTheme: () => void;

  patients: Patient[];
  appointments: Appointment[];
  leads: Lead[];
  expenses: Expense[];
  cashRegisters: CashRegister[];
  currentRegister: CashRegister | null;
  globalFinancials: FinancialRecord[];
  treatments: TreatmentItem[];
  procedures: Procedure[];
  professionals: Professional[];

  // New Config State
  priceTables: PriceTable[];
  insurancePlans: InsurancePlan[];
  clinicConfig: ClinicConfig;
  agendaConfig: AgendaConfig;

  // Documents State
  documents: ClinicalDocument[];
  templates: DocumentTemplate[];

  // Financial Settings (Fort Knox)
  financialSettings: ClinicFinancialSettings | null;

  // Actions
  addPatient: (patient: Patient) => void;
  updatePatient: (id: string, data: Partial<Patient>) => void;
  addLead: (lead: Lead) => void;
  updateLead: (id: string, data: Partial<Lead>) => void;

  // Agenda Actions
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (id: string, data: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  updateAgendaConfig: (config: Partial<AgendaConfig>) => void;

  // Settings Actions
  addProcedure: (procedure: Procedure) => void;
  updateProcedure: (id: string, data: Partial<Procedure>) => void;
  deleteProcedure: (id: string) => void;
  addProfessional: (professional: Professional) => void;
  updateProfessional: (id: string, data: Partial<Professional>) => void;

  updateClinicConfig: (config: Partial<ClinicConfig>) => void;

  addPriceTable: (table: PriceTable) => void;
  updatePriceTable: (id: string, data: Partial<PriceTable>) => void;

  addInsurancePlan: (plan: InsurancePlan) => void;
  updateInsurancePlan: (id: string, data: Partial<InsurancePlan>) => void;

  // Document Actions
  addTemplate: (template: DocumentTemplate) => void;
  updateTemplate: (id: string, data: Partial<DocumentTemplate>) => void;
  deleteTemplate: (id: string) => void;
  createDocument: (doc: ClinicalDocument) => void;
  signDocument: (id: string) => void;
  deleteDocument: (id: string) => void;

  // Complex Flows
  createBudget: (
    patientId: string,
    budgetData: Omit<Budget, "id" | "createdAt" | "status">
  ) => Promise<void>;
  updateBudget: (
    patientId: string,
    budgetId: string,
    budgetData: Partial<Budget>
  ) => Promise<void>;
  deleteBudget: (patientId: string, budgetId: string) => Promise<void>;
  approveBudget: (patientId: string, budgetId: string) => void;
  cancelBudget: (patientId: string, budgetId: string, reason: string) => void;
  sendToNegotiation: (patientId: string, budgetId: string) => string;
  refreshPatientData: (patientId: string) => Promise<void>;
  startTreatment: (patientId: string, treatmentId: string) => Promise<void>;
  concludeTreatment: (
    patientId: string,
    treatmentId: string,
    noteContent?: string
  ) => Promise<void>;

  // Financial Module Actions
  receivePayment: (
    patientId: string,
    installmentId: string,
    amount: number,
    method: string,
    date: string,
    notes?: string
  ) => Promise<void>;
  payExpense: (
    id: string,
    amount: number,
    method: string,
    date: string,
    notes?: string
  ) => void;

  addClinicalNote: (patientId: string, note: ClinicalNote) => void;
  openRegister: (initialBalance: number, user: string) => void;
  closeRegister: (
    id: string,
    closingBalance: number,
    observations?: string
  ) => void;
  addExpense: (expense: Omit<Expense, "id">) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { profile } = useAuth();
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") || "light";
  });

  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
  const [appointments, setAppointments] =
    useState<Appointment[]>(MOCK_APPOINTMENTS);
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);

  // Financial State delegated to FinancialContext
  const {
    expenses,
    cashRegisters,
    activeSession: currentRegister,
    globalTransactions: globalFinancials,
    financialSettings,
    openSession,
    closeSession,
    addExpense: addExpenseCtx,
    payExpense: payExpenseCtx,
    refreshFinancialData
  } = useFinancial();

  // Settings State
  const [procedures, setProcedures] = useState<Procedure[]>(INITIAL_PROCEDURES);
  const [professionals, setProfessionals] = useState<Professional[]>(
    INITIAL_PROFESSIONALS
  );
  const [priceTables, setPriceTables] =
    useState<PriceTable[]>(INITIAL_PRICE_TABLES);
  const [insurancePlans, setInsurancePlans] = useState<InsurancePlan[]>(
    INITIAL_INSURANCE_PLANS
  );
  const [clinicConfig, setClinicConfig] = useState<ClinicConfig>(
    INITIAL_CLINIC_CONFIG
  );
  const [agendaConfig, setAgendaConfig] = useState<AgendaConfig>(
    INITIAL_AGENDA_CONFIG
  );

  // Documents State
  const [documents, setDocuments] =
    useState<ClinicalDocument[]>(MOCK_DOCUMENTS);
  const [templates, setTemplates] =
    useState<DocumentTemplate[]>(INITIAL_TEMPLATES);

  // Derive all treatments for reporting
  const treatments = patients.flatMap((p) => p.treatments || []);

  // Theme Effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Fetch real patients from Supabase when user is logged in
  useEffect(() => {
    if (profile) {
      const fetchPatients = async () => {
        // Fetch patients
        const { data: patientsData, error: patientsError } = await supabase
          .from("patients")
          .select("*")
          .eq("clinic_id", profile.clinic_id)
          .order("name");

        if (patientsError) {
          console.error("Error fetching patients:", patientsError);
          return;
        }


        // Fetch Price Tables & Items
        const { data: ptData, error: ptError } = await supabase
          .from("price_tables")
          .select("*, items:price_table_items(*)")
          .eq("clinic_id", profile.clinic_id)
          .eq("active", true);

        if (ptError) console.error("Error fetching price tables:", ptError);
        else if (ptData) {
          setPriceTables(ptData.map(pt => ({
            id: pt.id,
            name: pt.name,
            type: pt.type as any,
            external_code: pt.external_code,
            active: pt.active,
            items: pt.items.map((i: any) => ({
              procedureId: i.procedure_id,
              price: i.price
            }))
          })));
        }

        // Fetch Procedures
        const { data: proceduresData, error: proceduresError } = await supabase
          .from("procedure")
          .select("*")
          .eq("clinic_id", profile.clinic_id)
          .order("name");

        if (proceduresError) console.error("Error fetching procedures:", proceduresError);
        else if (proceduresData) {
          setProcedures(proceduresData.map((proc: any) => ({
            id: proc.id,
            name: proc.name,
            category: proc.category,
            price: proc.base_price,
            duration: proc.duration_min || proc.duration || 30
          })));
        }

        // Fetch Professionals (from professionals table, joined with users)
        const { data: professionalsData, error: professionalsError } = await supabase
          .from("professionals")
          .select(`
            id,
            name,
            specialty,
            color,
            users!inner (
              id,
              active,
              clinic_id
            )
          `)
          .eq("users.clinic_id", profile.clinic_id)
          .eq("users.active", true)
          .order("name");

        if (professionalsError) console.error("Error fetching professionals:", professionalsError);
        else if (professionalsData) {
          setProfessionals(professionalsData.map((prof: any) => {
            // users is an array when using !inner join, get the first element
            const user = Array.isArray(prof.users) ? prof.users[0] : prof.users;
            return {
              id: user?.id || prof.id, // Use user ID for budget.doctor_id
              name: prof.name, // Professional name from professionals table
              role: prof.specialty || 'Dentista',
              color: prof.color || 'blue',
              active: true,
              email: ''
            };
          }));
        }



        // --- FINANCIAL DATA IS NOW HANDLED BY FINANCIAL CONTEXT ---
        // Removed duplicate fetching logic for expenses, settings, and cash registers


        // Removed duplicate fetching logic for expenses and registers




        // Fetch budgets, treatments, and financials for all patients
        const patientIds = patientsData?.map((p) => p.id) || [];
        if (patientIds.length > 0) {
          // Fetch budgets
          const { data: budgetsData, error: budgetsError } = await supabase
            .from("budgets")
            .select(
              `
              id,
              patient_id,
              created_at,
              doctor_id,
              status,
              total_value,
              discount,
              final_value,
              payment_config,
              price_table_id,
              users!inner (
                id,
                professional_id,
                professionals (
                  name
                )
              ),
              budget_items (
                id,
                procedure_name,
                region,
                quantity,
                unit_value,
                total_value
              )
            `
            )
            .in("patient_id", patientIds)
            .order("created_at", { ascending: false });

          if (budgetsError) {
            console.error("Error fetching budgets:", budgetsError);
          }

          // Fetch treatments
          const { data: treatmentsData, error: treatmentsError } =
            await supabase
              .from("treatment_items")
              .select(`
                *,
                doctor:users!doctor_id (
                  id,
                  professional_id,
                  professionals (
                    name
                  )
                )
              `)
              .in("patient_id", patientIds);

          if (treatmentsError) {
            console.error("Error fetching treatments:", treatmentsError);
          }

          // Fetch financials
          const { data: financialsData, error: financialsError } =
            await supabase
              .from("financial_installments")
              .select("*")
              .in("patient_id", patientIds);

          if (financialsError) {
            console.error("Error fetching financials:", financialsError);
          }

          // Map data to patients
          const patientsWithData =
            patientsData?.map((patient) => ({
              ...patient,
              budgets:
                budgetsData
                  ?.filter((b) => b.patient_id === patient.id)
                  .map((b) => {
                    // Get professional name from the joined data
                    // users is an array when using !inner join
                    const user = Array.isArray(b.users) ? b.users[0] : b.users;
                    const professional = Array.isArray(user?.professionals) ? user.professionals[0] : user?.professionals;
                    const professionalName = professional?.name || 'Profissional não informado';
                    return {
                      id: b.id,
                      createdAt: new Date(b.created_at).toLocaleDateString(
                        "pt-BR"
                      ),
                      doctorName: `Dr. ${professionalName}`,
                      doctorId: b.doctor_id,
                      status:
                        b.status === "DRAFT"
                          ? "Em Análise"
                          : b.status === "APPROVED"
                            ? "Aprovado"
                            : b.status,
                      items: b.budget_items.map((item) => ({
                        id: item.id,
                        procedure: item.procedure_name,
                        region: item.region,
                        quantity: item.quantity,
                        unitValue: item.unit_value,
                        total: item.total_value,
                      })),
                      totalValue: b.total_value,
                      discount: b.discount,
                      finalValue: b.final_value,
                      paymentConfig: b.payment_config,
                      priceTableId: b.price_table_id,
                    };
                  }) || [],
              treatments:
                treatmentsData
                  ?.filter((t) => t.patient_id === patient.id)
                  .map((t: any) => {
                    // Get professional name from the joined data
                    const user = Array.isArray(t.doctor) ? t.doctor[0] : t.doctor;
                    const professional = Array.isArray(user?.professionals) ? user.professionals[0] : user?.professionals;
                    const professionalName = professional?.name || 'Profissional não informado';
                    return {
                      id: t.id,
                      procedure: t.procedure_name,
                      region: t.region,
                      status:
                        t.status === "NOT_STARTED"
                          ? "Não Iniciado"
                          : t.status === "IN_PROGRESS"
                            ? "Em Andamento"
                            : t.status === "COMPLETED"
                              ? "Concluído"
                              : t.status,
                      budgetId: t.budget_id,
                      doctorName: `Dr. ${professionalName}`,
                      executionDate: t.execution_date ? new Date(t.execution_date).toLocaleDateString("pt-BR") : undefined,
                    };
                  }) || [],
              financials:
                financialsData
                  ?.filter((f) => f.patient_id === patient.id)
                  .map((f: any) => ({
                    id: f.id,
                    description: f.description,
                    dueDate: new Date(f.due_date).toLocaleDateString("pt-BR"),
                    amount: f.amount,
                    amountPaid: f.amount_paid || 0,
                    status:
                      f.status === "PENDING"
                        ? "Pendente"
                        : f.status === "PAID"
                          ? "Pago"
                          : f.status === "OVERDUE"
                            ? "Atrasado"
                            : f.status === "PARTIAL"
                              ? "Pago Parcial"
                              : f.status,
                    paymentMethod: f.payment_method,
                    paymentHistory: [],
                  })) || [],
            })) || [];

          setPatients(patientsWithData);
        } else {
          setPatients(patientsData || []);
        }
      };

      fetchPatients();
    } else {
      // Fallback to mock data if no clinic_id
      setPatients(MOCK_PATIENTS);
    }
  }, [profile?.clinic_id]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const addPatient = (patient: Patient) => {
    setPatients([...patients, patient]);
  };

  const updatePatient = (id: string, data: Partial<Patient>) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data } : p))
    );
  };

  const addLead = (lead: Lead) => {
    setLeads((prev) => [lead, ...prev]);
  };

  const updateLead = (id: string, data: Partial<Lead>) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...data } : l)));
  };

  // --- AGENDA ACTIONS ---
  const addAppointment = (appointment: Appointment) => {
    setAppointments((prev) => [...prev, appointment]);
  };

  const updateAppointment = (id: string, data: Partial<Appointment>) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...data } : a))
    );
  };

  const deleteAppointment = (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  };

  const updateAgendaConfig = (config: Partial<AgendaConfig>) => {
    setAgendaConfig((prev) => ({ ...prev, ...config }));
  };

  // --- SETTINGS ACTIONS ---
  const addProcedure = async (procedure: Procedure) => {
    try {
      const { data, error } = await supabase
        .from("procedure")
        .insert({
          clinic_id: profile.clinic_id,
          name: procedure.name,
          category: procedure.category,
          base_price: procedure.price,
          duration: procedure.duration,
          duration_min: procedure.duration,
          total_sessions: 1,
          sessions: 1
        })
        .select()
        .single();

      if (error) throw error;

      setProcedures((prev) => [...prev, {
        id: data.id,
        name: data.name,
        category: data.category,
        price: data.base_price,
        duration: data.duration_min || data.duration
      }]);
    } catch (error) {
      console.error("Error adding procedure:", error);
      alert("Erro ao adicionar procedimento: " + error.message);
    }
  };

  const updateProcedure = async (id: string, data: Partial<Procedure>) => {
    try {
      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.category) updateData.category = data.category;
      if (data.price !== undefined) updateData.base_price = data.price;
      if (data.duration) {
        updateData.duration = data.duration;
        updateData.duration_min = data.duration;
      }

      const { error } = await supabase
        .from("procedure")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      setProcedures((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...data } : p))
      );
    } catch (error) {
      console.error("Error updating procedure:", error);
      alert("Erro ao atualizar procedimento: " + error.message);
    }
  };

  const deleteProcedure = async (id: string) => {
    try {
      const { error } = await supabase
        .from("procedure")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setProcedures((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Error deleting procedure:", error);
      alert("Erro ao excluir procedimento: " + error.message);
    }
  };

  const addProfessional = (professional: Professional) => {
    setProfessionals((prev) => [...prev, professional]);
  };

  const updateProfessional = (id: string, data: Partial<Professional>) => {
    setProfessionals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data } : p))
    );
  };

  const updateClinicConfig = (config: Partial<ClinicConfig>) => {
    setClinicConfig((prev) => ({ ...prev, ...config }));
  };

  const addPriceTable = (table: PriceTable) => {
    setPriceTables((prev) => [...prev, table]);
  };

  const updatePriceTable = (id: string, data: Partial<PriceTable>) => {
    setPriceTables((prev) =>
      prev.map((pt) => (pt.id === id ? { ...pt, ...data } : pt))
    );
  };

  const addInsurancePlan = (plan: InsurancePlan) => {
    setInsurancePlans((prev) => [...prev, plan]);
  };

  const updateInsurancePlan = (id: string, data: Partial<InsurancePlan>) => {
    setInsurancePlans((prev) =>
      prev.map((ip) => (ip.id === id ? { ...ip, ...data } : ip))
    );
  };

  // --- DOCUMENT ACTIONS ---
  const addTemplate = (template: DocumentTemplate) => {
    setTemplates((prev) => [...prev, template]);
  };

  const updateTemplate = (id: string, data: Partial<DocumentTemplate>) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...data } : t))
    );
  };

  const deleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const createDocument = (doc: ClinicalDocument) => {
    setDocuments((prev) => [doc, ...prev]);
  };

  const signDocument = (id: string) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, status: "Assinado", signedAt: new Date().toISOString() }
          : d
      )
    );
  };

  const deleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  // 1. Create Budget
  const createBudget = async (
    patientId: string,
    budgetData: Omit<Budget, "id" | "createdAt" | "status">
  ) => {
    try {
      // Get current user as doctor
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("UsuÃ¡rio nÃ£o autenticado");
      }

      // Calculate totals
      let totalValue = 0;
      for (const item of budgetData.items) {
        if (item.quantity <= 0 || item.unitValue <= 0) {
          throw new Error("Quantidade e valor unitÃ¡rio devem ser positivos");
        }
        totalValue += item.total;
      }
      const discount = budgetData.discount || 0;
      if (discount < 0 || discount > totalValue) {
        throw new Error("Desconto invÃ¡lido");
      }
      const finalValue = totalValue - discount;

      // Insert budget
      const { data: budget, error: budgetError } = await supabase
        .from("budgets")
        .insert({
          patient_id: patientId,
          doctor_id: budgetData.doctorId || user.id, // Use provided doctorId or fallback to current user
          price_table_id: budgetData.priceTableId,
          status: "DRAFT",
          total_value: totalValue,
          discount: discount,
          final_value: finalValue,
          payment_config: budgetData.paymentConfig,
        })
        .select()
        .single();

      if (budgetError) throw budgetError;

      // Insert items
      const budgetItems = budgetData.items.map((item) => ({
        budget_id: budget.id,
        procedure_name: item.procedure,
        region: item.region,
        quantity: item.quantity,
        unit_value: item.unitValue,
        total_value: item.total,
      }));

      const { error: itemsError } = await supabase
        .from("budget_items")
        .insert(budgetItems);

      if (itemsError) {
        // Cleanup budget if items fail
        await supabase.from("budgets").delete().eq("id", budget.id);
        throw itemsError;
      }

      // Add to local state
      const newBudget: Budget = {
        id: budget.id,
        createdAt: new Date().toLocaleDateString("pt-BR"),
        status: "Em Análise",
        doctorName: `Dr. ${profile?.name || 'Não informado'}`,
        ...budgetData,
        totalValue: totalValue,
        finalValue: finalValue,
      };

      updatePatient(patientId, {
        budgets: [
          ...(patients.find((p) => p.id === patientId)?.budgets || []),
          newBudget,
        ],
      });
    } catch (error) {
      console.error("Error creating budget:", error);
      alert("Erro ao criar orÃ§amento: " + error.message);
    }
  };

  const updateBudget = async (
    patientId: string,
    budgetId: string,
    budgetData: Partial<Budget>
  ) => {
    try {
      // Check if approved
      const { data: existing, error: checkError } = await supabase
        .from("budgets")
        .select("status")
        .eq("id", budgetId)
        .single();

      if (checkError) throw checkError;
      if (existing.status === "APPROVED") {
        throw new Error("NÃ£o Ã© possÃ­vel editar orÃ§amento aprovado");
      }

      // Calculate new totals if items provided
      let totalValue = 0;
      let finalValue = 0;
      if (budgetData.items) {
        for (const item of budgetData.items) {
          if (item.quantity <= 0 || item.unitValue <= 0) {
            throw new Error("Quantidade e valor unitÃ¡rio devem ser positivos");
          }
          totalValue += item.total;
        }
        const discount = budgetData.discount || 0;
        if (discount < 0 || discount > totalValue) {
          throw new Error("Desconto invÃ¡lido");
        }
        finalValue = totalValue - discount;
      }

      // Update budget
      const updateData: any = { updated_at: new Date().toISOString() };
      if (budgetData.discount !== undefined)
        updateData.discount = budgetData.discount;
      if (budgetData.paymentConfig)
        updateData.payment_config = budgetData.paymentConfig;
      if (budgetData.doctorId)
        updateData.doctor_id = budgetData.doctorId;
      if (budgetData.items) {
        updateData.total_value = totalValue;
        updateData.final_value = finalValue;
      }

      const { error: budgetUpdateError } = await supabase
        .from("budgets")
        .update(updateData)
        .eq("id", budgetId);

      if (budgetUpdateError) throw budgetUpdateError;

      // Update items if provided
      if (budgetData.items) {
        // Delete old items
        const { error: deleteError } = await supabase
          .from("budget_items")
          .delete()
          .eq("budget_id", budgetId);

        if (deleteError) throw deleteError;

        // Insert new items
        const budgetItems = budgetData.items.map((item) => ({
          budget_id: budgetId,
          procedure_name: item.procedure,
          region: item.region,
          quantity: item.quantity,
          unit_value: item.unitValue,
          total_value: item.total,
        }));

        const { error: insertError } = await supabase
          .from("budget_items")
          .insert(budgetItems);

        if (insertError) throw insertError;
      }

      // Update local state
      const patient = patients.find((p) => p.id === patientId);
      if (!patient || !patient.budgets) return;

      const updatedBudgets = patient.budgets.map((b) =>
        b.id === budgetId
          ? {
            ...b,
            ...budgetData,
            totalValue: totalValue || b.totalValue,
            finalValue: finalValue || b.finalValue,
          }
          : b
      );

      updatePatient(patientId, { budgets: updatedBudgets });
    } catch (error) {
      console.error("Error updating budget:", error);
      alert("Erro ao atualizar orÃ§amento: " + error.message);
    }
  };

  const deleteBudget = async (patientId: string, budgetId: string) => {
    try {
      // Get budget info before deleting
      const { data: budgetToDelete, error: budgetFetchError } = await supabase
        .from("budgets")
        .select("status, final_value")
        .eq("id", budgetId)
        .single();

      if (budgetFetchError) throw budgetFetchError;

      // Delete related treatments
      const { error: deleteTreatmentsError } = await supabase
        .from("treatment_items")
        .delete()
        .eq("budget_id", budgetId);

      if (deleteTreatmentsError) throw deleteTreatmentsError;

      // Delete related financial installments (filter by description since no FK)
      const { data: installmentsToDelete } = await supabase
        .from("financial_installments")
        .select("id, amount_paid")
        .eq("patient_id", patientId)
        .ilike("description", `%${budgetId}%`);

      let totalPaidOnInstallments = 0;
      if (installmentsToDelete && installmentsToDelete.length > 0) {
        totalPaidOnInstallments = installmentsToDelete.reduce(
          (sum, inst) => sum + (inst.amount_paid || 0),
          0
        );
        const installmentIds = installmentsToDelete.map((i) => i.id);
        const { error: deleteFinancialsError } = await supabase
          .from("financial_installments")
          .delete()
          .in("id", installmentIds);

        if (deleteFinancialsError) throw deleteFinancialsError;
      }

      // Delete budget items first
      const { error: deleteItemsError } = await supabase
        .from("budget_items")
        .delete()
        .eq("budget_id", budgetId);

      if (deleteItemsError) throw deleteItemsError;

      // Delete budget
      const { error: deleteBudgetError } = await supabase
        .from("budgets")
        .delete()
        .eq("id", budgetId);

      if (deleteBudgetError) throw deleteBudgetError;

      // Revert patient totals if budget was approved
      if (budgetToDelete.status === "APPROVED") {
        const patient = patients.find((p) => p.id === patientId);
        if (patient) {
          const finalValue = budgetToDelete.final_value;
          const newTotalApproved = (patient.total_approved || 0) - finalValue;
          const newTotalPaid =
            (patient.total_paid || 0) - totalPaidOnInstallments;
          const newBalanceDue = newTotalApproved - newTotalPaid;

          const { error: revertPatientError } = await supabase
            .from("patients")
            .update({
              total_approved: newTotalApproved,
              total_paid: newTotalPaid,
              balance_due: newBalanceDue,
            })
            .eq("id", patientId);

          if (revertPatientError) throw revertPatientError;
        }
      }

      // Remove from local state
      const patient = patients.find((p) => p.id === patientId);
      if (!patient) return;

      const updatedBudgets = (patient.budgets || []).filter(
        (b) => b.id !== budgetId
      );
      const updatedTreatments = (patient.treatments || []).filter(
        (t) => t.budgetId !== budgetId
      );
      const updatedFinancials = (patient.financials || []).filter((f) =>
        !f.description?.includes(`#${budgetId}`)
      );

      // Revert totals locally if approved
      let updatedTotals = {};
      if (budgetToDelete.status === "APPROVED") {
        const finalValue = budgetToDelete.final_value;
        const newTotalApproved = (patient.total_approved || 0) - finalValue;
        const newTotalPaid =
          (patient.total_paid || 0) - totalPaidOnInstallments;
        const newBalanceDue = newTotalApproved - newTotalPaid;
        updatedTotals = {
          total_approved: newTotalApproved,
          total_paid: newTotalPaid,
          balance_due: newBalanceDue,
        };
      }

      updatePatient(patientId, {
        budgets: updatedBudgets,
        treatments: updatedTreatments,
        financials: updatedFinancials,
        ...updatedTotals,
      });
    } catch (error) {
      console.error("Error deleting budget:", error);
      alert("Erro ao excluir orÃ§amento: " + error.message);
    }
  };

  // 2. Approve Budget (Closes Opportunity as WON)
  const approveBudget = async (patientId: string, budgetId: string) => {
    try {
      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("UsuÃ¡rio nÃ£o autenticado");

      const patient = patients.find((p) => p.id === patientId);
      if (!patient || !patient.budgets) return;

      const budget = patient.budgets.find((b) => b.id === budgetId);
      if (!budget) return;

      // Update budget status in DB
      const { error: budgetError } = await supabase
        .from("budgets")
        .update({ status: "APPROVED" })
        .eq("id", budgetId);

      if (budgetError) throw budgetError;

      // Create treatments in DB
      const treatmentsInsertData = budget.items.map((item) => ({
        patient_id: patientId,
        budget_id: budgetId,
        procedure_name: item.procedure,
        region: item.region,
        status: "NOT_STARTED",
        doctor_id: budget.doctorId || user.id, // Use budget's doctor or fallback to current user
      }));

      const { error: treatmentsError } = await supabase
        .from("treatment_items")
        .insert(treatmentsInsertData);

      if (treatmentsError) throw treatmentsError;

      // Create financial installments in DB
      const installmentsCount = budget.paymentConfig?.installments || 1;
      const finalAmount = budget.finalValue || budget.totalValue;
      const installmentValue = finalAmount / installmentsCount;

      const installmentsData = [];
      for (let i = 0; i < installmentsCount; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + i + 1);

        installmentsData.push({
          patient_id: patientId,
          clinic_id: profile.clinic_id,
          description: `OrÃ§amento #${budgetId} - Parc. ${i + 1
            }/${installmentsCount}`,
          due_date: dueDate.toISOString().split("T")[0],
          amount: installmentValue,
          amount_paid: 0,
          status: "PENDING",
          payment_method: budget.paymentConfig?.method || "Boleto",
        });
      }

      const { error: installmentsError } = await supabase
        .from("financial_installments")
        .insert(installmentsData);

      if (installmentsError) throw installmentsError;

      // Update patient totals
      const newTotalApproved = (patient.total_approved || 0) + finalAmount;
      const newBalanceDue = (patient.balance_due || 0) + finalAmount;

      const { error: patientError } = await supabase
        .from("patients")
        .update({
          total_approved: newTotalApproved,
          balance_due: newBalanceDue,
        })
        .eq("id", patientId);

      if (patientError) throw patientError;

      // Create local treatments and financials for state
      const newTreatments: TreatmentItem[] = budget.items.map((item) => ({
        id: Math.random().toString(36).substr(2, 5),
        procedure: item.procedure,
        region: item.region,
        status: "Não Iniciado",
        budgetId: budget.id,
        doctorName: budget.doctorName,
      }));

      const newFinancials: FinancialInstallment[] = [];
      for (let i = 0; i < installmentsCount; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + i + 1);

        newFinancials.push({
          id: Math.random().toString(36).substr(2, 5),
          description: `Orçamento #${budgetId} - Parc. ${i + 1
            }/${installmentsCount}`,
          dueDate: dueDate.toLocaleDateString("pt-BR"),
          amount: installmentValue,
          amountPaid: 0,
          status: "Pendente",
          paymentMethod: budget.paymentConfig?.method || "Boleto",
          paymentHistory: [],
        });
      }

      // Update local state
      const updatedBudgets = patient.budgets.map((b) =>
        b.id === budgetId ? { ...b, status: "Aprovado" as const } : b
      );

      // For simplicity, update only budgets and status locally, treatments/financials will be fetched on next load
      updatePatient(patientId, {
        budgets: updatedBudgets,
        total_approved: newTotalApproved,
        balance_due: newBalanceDue,
        status: "Em Tratamento",
      });

      // Close associated lead
      const linkedLead = leads.find((l) => l.budgetId === budgetId);
      if (linkedLead) {
        updateLead(linkedLead.id, {
          status: LeadStatus.WON,
          history: [
            ...linkedLead.history,
            {
              id: Math.random().toString(36).substr(2, 5),
              type: "System",
              content: `Orçamento #${budgetId} aprovado. Oportunidade ganha!`,
              date: new Date().toISOString(),
              user: "System",
            },
          ],
        });
      }

      // Reload treatments and financials from DB
      const { data: treatmentsData } = await supabase
        .from("treatment_items")
        .select("*")
        .eq("patient_id", patientId);

      const { data: financialsData } = await supabase
        .from("financial_installments")
        .select("*")
        .eq("patient_id", patientId);

      updatePatient(patientId, {
        treatments:
          treatmentsData?.map((t: any) => ({
            id: t.id,
            procedure: t.procedure_name,
            region: t.region,
            status:
              t.status === "NOT_STARTED"
                ? "Não Iniciado"
                : t.status === "IN_PROGRESS"
                  ? "Em Andamento"
                  : t.status === "COMPLETED"
                    ? "Concluído"
                    : t.status,
            budgetId: t.budget_id,
            doctorName: `Dr. ${profile?.name || 'Não informado'}`,
          })) || [],
        financials:
          financialsData?.map((f: any) => ({
            id: f.id,
            description: f.description,
            dueDate: new Date(f.due_date).toLocaleDateString("pt-BR"),
            amount: f.amount,
            amountPaid: f.amount_paid || 0,
            status:
              f.status === "PENDING"
                ? "Pendente"
                : f.status === "PAID"
                  ? "Pago"
                  : f.status === "OVERDUE"
                    ? "Atrasado"
                    : f.status === "PARTIAL"
                      ? "Pago Parcial"
                      : f.status,
            paymentMethod: f.payment_method,
            paymentHistory: [], // TODO: fetch payment_history if needed
          })) || [],
      });
    } catch (error) {
      console.error("Error approving budget:", error);
      alert("Erro ao aprovar orÃ§amento: " + error.message);
    }
  };

  // 3. Cancel Budget (Closes Opportunity as LOST)
  const cancelBudget = (
    patientId: string,
    budgetId: string,
    reason: string
  ) => {
    const patient = patients.find((p) => p.id === patientId);
    if (!patient || !patient.budgets) return;

    // Update Budget Status
    const updatedBudgets = patient.budgets.map((b) =>
      b.id === budgetId ? { ...b, status: "Reprovado" as const } : b
    );

    // Add Note to History
    const note: ClinicalNote = {
      id: Math.random().toString(36).substr(2, 5),
      date: new Date().toLocaleDateString("pt-BR"),
      doctorName: "System",
      type: "Evolução",
      content: `Orçamento #${budgetId} reprovado. Motivo: ${reason}`,
    };

    updatePatient(patientId, {
      budgets: updatedBudgets,
      notes: [note, ...(patient.notes || [])],
    });

    // Close Associated Lead (if any)
    const linkedLead = leads.find((l) => l.budgetId === budgetId);
    if (linkedLead) {
      updateLead(linkedLead.id, {
        status: LeadStatus.LOST,
        history: [
          ...linkedLead.history,
          {
            id: Math.random().toString(36).substr(2, 5),
            type: "System",
            content: `Orçamento #${budgetId} reprovado. Motivo: ${reason}`,
            date: new Date().toISOString(),
            user: "System",
          },
        ],
      });
    }
  };

  // 4. Send to Negotiation (Creates Lead)
  const refreshPatientData = async (patientId: string) => {
    try {
      // Fetch treatments
      const { data: treatmentsData, error: treatmentsError } = await supabase
        .from("treatment_items")
        .select("*")
        .eq("patient_id", patientId);

      if (treatmentsError) {
        console.error("Error fetching treatments:", treatmentsError);
        return;
      }

      // Fetch financials
      const { data: financialsData, error: financialsError } = await supabase
        .from("financial_installments")
        .select("*")
        .eq("patient_id", patientId);

      if (financialsError) {
        console.error("Error fetching financials:", financialsError);
        return;
      }

      const mappedTreatments =
        treatmentsData?.map((t: any) => ({
          id: t.id,
          procedure: t.procedure_name,
          region: t.region,
          status:
            t.status === "NOT_STARTED"
              ? "Não Iniciado"
              : t.status === "IN_PROGRESS"
                ? "Em Andamento"
                : t.status === "COMPLETED"
                  ? "Concluído"
                  : t.status,
          budgetId: t.budget_id,
          doctorName: `Dr. ${profile?.name || 'Não informado'}`,
          executionDate: t.execution_date
            ? new Date(t.execution_date).toLocaleDateString("pt-BR")
            : undefined,
        })) || [];

      const mappedFinancials =
        financialsData?.map((f: any) => ({
          id: f.id,
          description: f.description,
          dueDate: new Date(f.due_date).toLocaleDateString("pt-BR"),
          amount: f.amount,
          amountPaid: f.amount_paid || 0,
          status:
            f.status === "PENDING"
              ? "Pendente"
              : f.status === "PAID"
                ? "Pago"
                : f.status === "OVERDUE"
                  ? "Atrasado"
                  : f.status === "PARTIAL"
                    ? "Pago Parcial"
                    : f.status,
          paymentMethod: f.payment_method,
          paymentHistory: [], // TODO: fetch payment_history if needed
        })) || [];

      updatePatient(patientId, {
        treatments: mappedTreatments,
        financials: mappedFinancials,
      });
    } catch (error) {
      console.error("Error refreshing patient data:", error);
    }
  };

  const sendToNegotiation = (patientId: string, budgetId: string) => {
    const patient = patients.find((p) => p.id === patientId);
    if (!patient || !patient.budgets) return "";

    const budget = patient.budgets.find((b) => b.id === budgetId);
    if (!budget) return "";

    // Check for duplicates (Active Lead)
    const existingLead = leads.find(
      (l) =>
        l.budgetId === budgetId &&
        l.status !== LeadStatus.LOST &&
        l.status !== LeadStatus.WON
    );
    if (existingLead) return existingLead.id;

    // Update Budget Status (Marks as in negotiation, but stays in list until Lost)
    const updatedBudgets = patient.budgets.map((b) =>
      b.id === budgetId ? { ...b, status: "Em Negociação" as const } : b
    );
    updatePatient(patientId, { budgets: updatedBudgets });

    // Create CRM Lead
    const newLead: Lead = {
      id: Math.random().toString(36).substr(2, 5),
      name: patient.name,
      phone: patient.phone,
      email: patient.email,
      source: "Orçamento", // Explicit source
      budgetId: budget.id, // Explicit Link
      status: LeadStatus.NEGOTIATION,
      interest: "Alto",
      value: budget.finalValue || budget.totalValue,
      createdAt: new Date().toISOString(),
      lastInteraction: new Date().toISOString(),
      history: [
        {
          id: Math.random().toString(36).substr(2, 5),
          type: "System",
          content: `Oportunidade gerada a partir do OrÃ§amento #${budgetId}.`,
          date: new Date().toISOString(),
          user: "System",
        },
      ],
      tasks: [
        {
          id: Math.random().toString(36).substr(2, 5),
          title: `Negociar OrÃ§amento #${budgetId}`,
          dueDate: new Date().toISOString().split("T")[0], // Today
          completed: false,
        },
      ],
    };

    addLead(newLead);
    return newLead.id;
  };

  const startTreatment = async (patientId: string, treatmentId: string) => {
    try {
      // Update treatment status in DB
      const { error: updateError } = await supabase
        .from("treatment_items")
        .update({
          status: "IN_PROGRESS",
          updated_at: new Date().toISOString(),
          updated_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq("id", treatmentId);

      if (updateError) throw updateError;

      // Reload treatments from DB to ensure consistency
      const { data: treatmentsData } = await supabase
        .from("treatment_items")
        .select("*")
        .eq("patient_id", patientId);

      const mappedTreatments =
        treatmentsData?.map((t: any) => ({
          id: t.id,
          procedure: t.procedure_name,
          region: t.region,
          status:
            t.status === "NOT_STARTED"
              ? "NÃ£o Iniciado"
              : t.status === "IN_PROGRESS"
                ? "Em Andamento"
                : t.status === "COMPLETED"
                  ? "ConcluÃ­do"
                  : t.status,
          budgetId: t.budget_id,
          doctorName: `Dr. ${profile?.name || 'Não informado'}`,
        })) || [];

      updatePatient(patientId, { treatments: mappedTreatments });
    } catch (error) {
      console.error("Error starting treatment:", error);
      alert("Erro ao iniciar tratamento: " + error.message);
    }
  };

  const concludeTreatment = async (
    patientId: string,
    treatmentId: string,
    noteContent?: string
  ) => {
    try {
      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("UsuÃ¡rio nÃ£o autenticado");

      // Update treatment status in DB
      const { error: updateError } = await supabase
        .from("treatment_items")
        .update({
          status: "COMPLETED",
          execution_date: new Date().toISOString().split("T")[0],
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        })
        .eq("id", treatmentId);

      if (updateError) throw updateError;

      // Reload treatments from DB to ensure consistency
      const { data: treatmentsData } = await supabase
        .from("treatment_items")
        .select(`
          *,
          doctor:users!doctor_id (
            id,
            professional_id,
            professionals (
              name
            )
          )
        `)
        .eq("patient_id", patientId);

      const mappedTreatments =
        treatmentsData?.map((t: any) => {
          // Get professional name from the joined data
          const user = Array.isArray(t.doctor) ? t.doctor[0] : t.doctor;
          const professional = Array.isArray(user?.professionals) ? user.professionals[0] : user?.professionals;
          const professionalName = professional?.name || 'Profissional não informado';
          return {
            id: t.id,
            procedure: t.procedure_name,
            region: t.region,
            status:
              t.status === "NOT_STARTED"
                ? "Não Iniciado"
                : t.status === "IN_PROGRESS"
                  ? "Em Andamento"
                  : t.status === "COMPLETED"
                    ? "Concluído"
                    : t.status,
            budgetId: t.budget_id,
            doctorName: `Dr. ${professionalName}`,
            executionDate: t.execution_date
              ? new Date(t.execution_date).toLocaleDateString("pt-BR")
              : undefined,
          };
        }) || [];

      const defaultContent = `Procedimento realizado: ${treatmentId}. Paciente liberado sem intercorrÃªncias.`;
      const finalContent = noteContent
        ? `${noteContent} \n\n(Ref: ${treatmentId})`
        : defaultContent;

      const newNote: ClinicalNote = {
        id: Math.random().toString(36).substr(2, 5),
        date: new Date().toLocaleDateString("pt-BR"),
        doctorName: "Dr. Marcelo Vilas Boas",
        type: "Evolução",
        content: finalContent,
      };

      // Insert clinical note in DB
      const { error: noteError } = await supabase
        .from("clinical_notes")
        .insert({
          patient_id: patientId,
          doctor_id: user.id,
          type: "EvoluÃ§Ã£o",
          content: finalContent,
          date: new Date().toISOString().split("T")[0],
        });

      if (noteError) throw noteError;

      updatePatient(patientId, {
        treatments: mappedTreatments,
        notes: [
          newNote,
          ...(patients.find((p) => p.id === patientId)?.notes || []),
        ],
      });
    } catch (error) {
      console.error("Error concluding treatment:", error);
      alert("Erro ao concluir tratamento: " + error.message);
    }
  };

  // 5. Receive Payment (INTEGRATED WITH CASH REGISTER)
  const receivePayment = async (
    patientId: string,
    installmentId: string,
    amount: number,
    method: string,
    date: string,
    notes?: string
  ) => {
    try {
      // Update installment in DB
      const currentPaidResult = await supabase
        .from("financial_installments")
        .select("amount_paid, amount")
        .eq("id", installmentId)
        .single();

      if (currentPaidResult.error) throw currentPaidResult.error;

      const currentPaid = currentPaidResult.data.amount_paid || 0;
      const newPaidTotal = currentPaid + amount;
      const isFullyPaid = newPaidTotal >= currentPaidResult.data.amount;

      const { error: installmentError } = await supabase
        .from("financial_installments")
        .update({
          amount_paid: newPaidTotal,
          status: isFullyPaid ? "PAID" : "PARTIAL",
          payment_method: method,
        })
        .eq("id", installmentId);

      if (installmentError) throw installmentError;

      // Insert payment history
      const { error: historyError } = await supabase
        .from("payment_history")
        .insert({
          installment_id: installmentId,
          amount: amount,
          date: date,
          method: method,
          notes: notes || "",
        });

      if (historyError) throw historyError;

      // Update patient totals
      const patient = patients.find((p) => p.id === patientId);
      if (!patient) return;

      const newTotalPaid = (patient.total_paid || 0) + amount;
      const newBalanceDue = (patient.balance_due || 0) - amount;

      const { error: patientError } = await supabase
        .from("patients")
        .update({
          total_paid: newTotalPaid,
          balance_due: newBalanceDue,
        })
        .eq("id", patientId);

      if (patientError) throw patientError;

      // Update local state
      if (!patient.financials) return;

      const installment = patient.financials.find(
        (f) => f.id === installmentId
      );
      if (!installment) return;

      const newHistory = [
        ...(installment.paymentHistory || []),
        {
          date,
          amount,
          method,
          notes,
        },
      ];

      const updatedFinancials = patient.financials.map((f) =>
        f.id === installmentId
          ? {
            ...f,
            status: isFullyPaid
              ? ("Pago" as const)
              : ("Pago Parcial" as const),
            amountPaid: newPaidTotal,
            paymentHistory: newHistory,
          }
          : f
      );

      updatePatient(patientId, {
        financials: updatedFinancials,
        total_paid: newTotalPaid,
        balance_due: newBalanceDue,
      });

      // Update Global Financials via refresh
      await refreshFinancialData();


    } catch (error) {
      console.error("Error receiving payment:", error);
      alert("Erro ao registrar pagamento: " + error.message);
    }
  };

  const addClinicalNote = (patientId: string, note: ClinicalNote) => {
    const patient = patients.find((p) => p.id === patientId);
    if (!patient) return;
    updatePatient(patientId, {
      notes: [note, ...(patient.notes || [])],
    });
  };

  // --- FINANCIAL MODULE ACTIONS ---

  // --- FINANCIAL MODULE ACTIONS (DELEGATED) ---

  const openRegister = async (initialBalance: number, user: string) => {
    await openSession(initialBalance, user);
  };

  const closeRegister = async (
    id: string,
    closingBalance: number,
    observations?: string
  ) => {
    await closeSession(id, closingBalance, observations);
  };

  const addExpense = async (expense: Omit<Expense, "id">) => {
    await addExpenseCtx(expense);
  };

  const payExpense = async (
    id: string,
    amount: number,
    method: string,
    date: string,
    notes?: string
  ) => {
    await payExpenseCtx(id, amount, method, date, notes);
  };

  return (
    <DataContext.Provider
      value={{
        theme,
        toggleTheme,
        patients,
        appointments,
        leads,
        expenses,
        cashRegisters,
        currentRegister,
        globalFinancials,
        treatments,
        procedures,
        professionals,
        priceTables,
        insurancePlans,
        clinicConfig,
        agendaConfig,
        documents,
        templates,
        addPatient,
        updatePatient,
        addLead,
        updateLead,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        updateAgendaConfig,
        addProcedure,
        updateProcedure,
        deleteProcedure,
        addProfessional,
        updateProfessional,
        updateClinicConfig,
        addPriceTable,
        updatePriceTable,
        addInsurancePlan,
        updateInsurancePlan,
        addTemplate,
        updateTemplate,
        deleteTemplate,
        createDocument,
        signDocument,
        deleteDocument,
        createBudget,
        updateBudget,
        deleteBudget,
        approveBudget,
        cancelBudget,
        sendToNegotiation,
        refreshPatientData,
        startTreatment,
        concludeTreatment,
        receivePayment,
        addClinicalNote,
        openRegister,
        closeRegister,
        addExpense,
        payExpense,
        financialSettings,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within a DataProvider");
  return context;
};


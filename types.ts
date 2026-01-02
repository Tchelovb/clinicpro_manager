export enum LeadStatus {
  NEW = "Nova Oportunidade",
  CONTACT = "Em Contato",
  QUALIFICATION = "Qualificação",
  SCHEDULED = "Avaliação Agendada",
  PROPOSAL = "Orçamento Enviado",
  NEGOTIATION = "Negociação",
  WON = "Aprovado",
  LOST = "Perdido",
}

// --- AUTH TYPES ---

export type UserRole = 'ADMIN' | 'PROFESSIONAL' | 'RECEPTIONIST' | 'CRC';

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador (Sócio Estrategista)',
  PROFESSIONAL: 'Profissional Clínico (Guardião da Técnica)',
  RECEPTIONIST: 'Recepcionista (Mestre de Fluxo)',
  CRC: 'Consultor de Vendas (Arquiteta de Conversão/CRC)'
};

export type InteractionType = "Note" | "Call" | "WhatsApp" | "Email" | "System";

export interface Interaction {
  id: string;
  type: InteractionType;
  content: string;
  date: string; // ISO string
  user: string;
}

export interface LeadTask {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source:
  | "Instagram"
  | "Google"
  | "Indicação"
  | "Facebook"
  | "Tráfego Pago"
  | "Orçamento";
  status: LeadStatus;
  interest?: "Alto" | "Médio" | "Baixo"; // New field
  createdAt: string;
  lastInteraction: string; // ISO String
  nextFollowUp?: string; // ISO String
  owner?: string;
  value?: number;
  history: Interaction[];
  tasks: LeadTask[];
  budgetId?: string; // Link to specific budget
}

// --- PATIENT MODULE TYPES ---

export type PatientStatus =
  | "Em Tratamento"
  | "Em Orçamento"
  | "Finalizado"
  | "Manutenção"
  | "Arquivo";

export interface ClinicalNote {
  id: string;
  date: string;
  doctorName: string;
  content: string;
  type: "Evolução" | "Anamnese" | "Exame" | "Documento";
  attachments?: string[];
}

export interface BudgetItem {
  id: string;
  procedure: string;
  region: string; // Tooth or Area
  face?: string; // New: Face do dente
  tooth_number?: string; // New: Número do dente específico
  quantity: number;
  unitValue: number;
  total: number;
}

export interface Budget {
  id: string;
  createdAt: string;
  doctorName: string;
  doctorId?: string; // UUID of the professional responsible
  status: "DRAFT" | "PENDING" | "WAITING_CLOSING" | "APPROVED" | "REJECTED" | "PAID";
  items: BudgetItem[];
  totalValue: number;
  discount?: number;
  finalValue?: number;
  paymentConfig?: {
    method: "Pix" | "Cartão" | "Boleto" | "Dinheiro";
    installments: number;
  };
  priceTableId?: string; // New: Link to used price table
  categoryId?: 'Cirurgias Estéticas da Face' | 'Harmonização Facial' | 'Implantodontia' | 'Ortodontia' | 'Clínica Geral';
  rejectionReason?: string;
  lostAt?: string;
  potentialMargin?: number;

  // New Financial Intelligence Fields
  option_label?: string; // Ex: "Opção Premium"
  expires_at?: string;
  discount_type?: 'PERCENTAGE' | 'FIXED';
  discount_value?: number; // The logic value (e.g. 10 for 10% or 100 for R$100)
  down_payment_value?: number; // Entrada
  installments_count?: number;
}

export interface TreatmentItem {
  id: string;
  procedure: string;
  region: string;
  status: "Não Iniciado" | "Em Andamento" | "Concluído";
  doctorName?: string;
  executionDate?: string;
  budgetId: string;
  category?: string;
}

export interface PaymentHistoryItem {
  date: string;
  amount: number;
  method: string;
  notes?: string;
}

export interface FinancialInstallment {
  id: string;
  description: string;
  dueDate: string;
  amount: number;
  amountPaid?: number; // Valor já pago (para parciais)
  status: "Pago" | "Pendente" | "Atrasado" | "Pago Parcial";
  paymentMethod: "Pix" | "Cartão" | "Boleto" | "Dinheiro";
  paymentHistory?: PaymentHistoryItem[];
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  cpf: string;
  rg?: string; // RG/Identidade
  birth_date?: string;
  gender?: string;
  address?: string;
  status: string;
  total_approved: number;
  total_paid: number;
  balance_due: number;
  created_at: string;
  updated_at: string;
  clinic_id: string;

  // Informações Pessoais Adicionais
  civilStatus?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | 'OTHER';
  profession?: string;
  contact_preference?: string;
  origin?: string;

  // Endereço Detalhado
  zip_code?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;

  // Compatibilidade Legado (Mantendo opcionais)
  zipCode?: string; // Mapeado para zip_code
  contactPreference?: 'PHONE' | 'EMAIL' | 'WHATSAPP' | 'SMS'; // Mapeado para contact_preference

  // Convênio/Plano de Saúde
  insurance?: string;
  insuranceCardNumber?: string;

  // Notas Clínicas
  initialClinicalNotes?: string;
  generalNotes?: string;

  // Dossiê High-Ticket (CRM de Luxo)
  nickname?: string; // Apelido/Como prefere ser chamado
  occupation?: string; // Profissão
  instagram_handle?: string; // Instagram
  marital_status?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | 'OTHER';
  wedding_anniversary?: string; // Data de aniversário de casamento
  vip_notes?: string; // Notas VIP de preferências

  // Status e Responsáveis
  clinical_status?: string; // Em tratamento, Manutenção, etc.
  responsible_doctor?: string; // ID do dentista responsável (DB)
  responsibleDoctor?: string; // Alias para frontend camelCaseências

  // Classificação ABC
  patient_score?: 'DIAMOND' | 'GOLD' | 'STANDARD' | 'RISK' | 'BLACKLIST';
  bad_debtor?: boolean;
  sentiment_status?: 'VERY_HAPPY' | 'HAPPY' | 'NEUTRAL' | 'UNHAPPY' | 'COMPLAINING';
  is_active?: boolean; // Controla se o paciente está ativo no sistema

  // Responsável Financeiro (Guarantor)
  responsible_party_id?: string;
  relationship_type?: 'SELF' | 'PARENT' | 'SPOUSE' | 'CHILD' | 'GUARDIAN' | 'OTHER';

  // Programa de Indicação
  indication_patient_id?: string;

  // Galeria de Fotos
  photo_profile_url?: string;
  photo_smile_url?: string;
  photo_frontal_url?: string;
  photo_profile_side_url?: string;
  photo_document_front_url?: string;
  photo_document_back_url?: string;
  profile_photo_url?: string; // Legacy field backup

  // Linked Data (for detailed queries)
  budgets?: Budget[];
  treatments?: TreatmentItem[];
  financials?: FinancialInstallment[];
  notes?: ClinicalNote[];
  acquisitionSourceId?: string;
  lastAestheticEvaluation?: string; // Date string
  patientRanking?: 'STANDARD' | 'VIP' | 'GOLD' | 'PLATINUM';
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId?: string; // Standardized CamelCase
  doctor_id?: string; // Database snake_case compatibility
  doctorName: string;
  date: string;
  time: string;
  type: "Avaliação" | "Procedimento" | "Retorno" | "Urgência" | "EVALUATION" | "TREATMENT" | "RETURN" | "URGENCY"; // Added database enums
  status: "Confirmado" | "Pendente" | "Concluído" | "Cancelado" | "Faltou" | "CONFIRMED" | "PENDING" | "COMPLETED" | "CANCELLED" | "NO_SHOW"; // Added database enums
  notes?: string;
  duration?: number;
  clinic_id?: string;
  budget_id?: string; // Link to Financial
  budgetId?: string; // Frontend Alias
}

// --- NEW FINANCIAL MODULE TYPES ---

export interface FinancialRecord {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  category: string;
  status: "Pago" | "Pendente";
  cashRegisterId?: string; // Links transaction to a specific daily register
  paymentMethod?: string;
  categoryId?: string; // Links transaction to a budget category
}

export interface Expense {
  id: string;
  description: string;
  category: "Fixa" | "Variável" | "Impostos" | "Laboratório" | "Pessoal";
  provider: string;
  amount: number;
  amountPaid?: number;
  dueDate: string;
  status: "Pendente" | "Pago" | "Atrasado" | "Pago Parcial";
  paymentMethod?: string;
  paymentHistory?: PaymentHistoryItem[];
  isVariableCost?: boolean;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  isVariableCost: boolean;
}

export interface ProcedureCost {
  procedureId: string;
  materialCost: number;
  professionalCost: number;
  operationalOverhead: number;
  taxPercent: number;
  cardFeePercent: number;
}

export interface ProfessionalGoal {
  id: string;
  professionalId: string;
  month: string; // YYYY-MM-DD (first day of month)
  revenueGoal: number;
  conversionGoal: number;
}

// --- FORT KNOX FINANCIAL TYPES ---

export interface ClinicFinancialSettings {
  clinic_id: string;
  force_cash_opening: boolean;
  force_daily_closing: boolean;
  allow_negative_balance: boolean;
  blind_closing: boolean;
  default_change_fund: number;
  max_difference_without_approval: number;
}

export type CashSessionStatus = "OPEN" | "CLOSED" | "AUDIT_PENDING";

export interface CashSession {
  id: string;
  clinic_id: string;
  user_id: string;
  opened_at: string;
  closed_at?: string;
  opening_balance: number;
  calculated_balance: number;
  declared_balance?: number;
  difference_amount?: number;
  difference_reason?: string;
  status: CashSessionStatus;
  observations?: string;
}

export interface ActiveSession extends CashSession {
  user_name: string;
  user_email: string;
  current_balance: number;
  transaction_count: number;
  hours_open: number;
}

export interface CashClosingData {
  declared_balance: number;
  difference_reason?: string;
  card_totals?: Record<string, number>; // Ex: { "Visa": 800, "Master": 300 }
}

export interface CashRegister {
  id: string;
  openedAt: string; // ISO String
  closedAt?: string; // ISO String
  responsibleName: string;
  openingBalance: number;
  closingBalance?: number;
  calculatedBalance: number; // Running total
  status: "Aberto" | "Fechado";
  observations?: string;
  transactions: FinancialRecord[];
}

export interface KPIMetric {
  label: string;
  value: string | number;
  change: number; // percentage
  trend: "up" | "down" | "neutral";
}

// --- SETTINGS TYPES ---

export interface Procedure {
  id: string;
  name: string;
  category: string;
  price: number; // Base Price
  duration: number; // minutes
}

export interface PriceTableItem {
  procedureId: string;
  price: number;
}

export interface PriceTable {
  id: string;
  name: string;
  type: "PARTICULAR" | "CONVENIO" | "PARCERIA" | "OUTROS";
  external_code?: string;
  active: boolean;
  items?: PriceTableItem[];
  // notes e contact_phone são opcionais e usados apenas no UI de gestão
}

export interface InsurancePlan {
  id: string;
  name: string;
  code?: string;
  priceTableId: string; // Links to a specific price table
  active: boolean;
}

export interface Professional {
  id: string;
  name: string;
  role: "Dentista" | "Recepcionista" | "Administrador" | "Auxiliar";
  color: string; // for agenda UI
  active: boolean;
  email?: string;
  phone?: string;
}

export interface ClinicConfig {
  name: string;
  cnpj: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  primaryColor?: string;
}

export interface AgendaConfig {
  startHour: string;
  endHour: string;
  slotDuration: number; // minutes
  daysOfWeek: number[]; // 0=Sun, 1=Mon...
}

// --- DOCUMENTS MODULE TYPES ---

export type DocumentType =
  | "Contrato"
  | "TCLE"
  | "Anamnese"
  | "Atestado"
  | "Receita"
  | "Outro";
export type DocumentStatus = "Rascunho" | "Pendente" | "Assinado" | "Cancelado";

export interface DocumentTemplate {
  id: string;
  name: string;
  type: DocumentType;
  content: string; // HTML or Text with {{placeholders}}
  createdAt: string;
  updatedAt: string;
}

export interface ClinicalDocument {
  id: string;
  patientId: string;
  patientName: string;
  type: DocumentType;
  title: string;
  content: string; // The parsed content
  status: DocumentStatus;
  createdAt: string;
  signedAt?: string;
  templateId?: string;
}

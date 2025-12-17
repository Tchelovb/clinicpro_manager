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
  quantity: number;
  unitValue: number;
  total: number;
}

export interface Budget {
  id: string;
  createdAt: string;
  doctorName: string;
  status: "Em Análise" | "Enviado" | "Aprovado" | "Reprovado" | "Em Negociação";
  items: BudgetItem[];
  totalValue: number;
  discount?: number;
  finalValue?: number;
  paymentConfig?: {
    method: "Pix" | "Cartão" | "Boleto" | "Dinheiro";
    installments: number;
  };
  priceTableId?: string; // New: Link to used price table
}

export interface TreatmentItem {
  id: string;
  procedure: string;
  region: string;
  status: "Não Iniciado" | "Em Andamento" | "Concluído";
  doctorName?: string;
  executionDate?: string;
  budgetId: string;
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

  // Linked Data (for detailed queries)
  budgets?: Budget[];
  treatments?: TreatmentItem[];
  financials?: FinancialInstallment[];
  notes?: ClinicalNote[];
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  type: "Avaliação" | "Procedimento" | "Retorno" | "Urgência";
  status: "Confirmado" | "Pendente" | "Concluído" | "Cancelado" | "Faltou";
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
  items: PriceTableItem[]; // If procedure not here, use base price
  active: boolean;
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

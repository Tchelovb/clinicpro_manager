-- ============================================================
-- ClinicPro Database Schema for Supabase
-- Última atualização: Dezembro 2025
-- Schema completo refletindo a realidade atual do banco de dados
-- ============================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =================================================================
-- TIPOS ENUM (USER-DEFINED TYPES)
-- =================================================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role') THEN
        CREATE TYPE role AS ENUM ('ADMIN', 'DENTIST', 'RECEPTIONIST', 'ASSISTANT');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status') THEN
        CREATE TYPE lead_status AS ENUM ('NEW', 'CONTACT', 'QUALIFICATION', 'SCHEDULED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
        CREATE TYPE appointment_status AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELED', 'MISSED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_type') THEN
        CREATE TYPE appointment_type AS ENUM ('EVALUATION', 'PROCEDURE', 'RETURN', 'URGENCY');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'budget_status') THEN
        CREATE TYPE budget_status AS ENUM ('DRAFT', 'SENT', 'NEGOTIATION', 'APPROVED', 'REJECTED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'treatment_status') THEN
        CREATE TYPE treatment_status AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'PARTIAL', 'OVERDUE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
        CREATE TYPE transaction_type AS ENUM ('INCOME', 'EXPENSE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_type') THEN
        CREATE TYPE document_type AS ENUM ('CONTRACT', 'CONSENT', 'ANAMNESIS', 'CERTIFICATE', 'PRESCRIPTION', 'OTHER');
    END IF;
END $$;

-- =================================================================
-- TABELA: clinics
-- Armazena dados das clínicas (multi-tenancy)
-- =================================================================
CREATE TABLE IF NOT EXISTS public.clinics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  cnpj TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  opening_time TIME WITHOUT TIME ZONE,
  closing_time TIME WITHOUT TIME ZONE,
  slot_duration INTEGER DEFAULT 30,
  working_days TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- TABELA: professionals
-- Profissionais da clínica (dentistas, auxiliares, etc.)
-- =================================================================
CREATE TABLE IF NOT EXISTS public.professionals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  crc TEXT UNIQUE,
  specialty TEXT,
  council TEXT,
  is_active BOOLEAN DEFAULT true,
  photo_url TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- TABELA: users
-- Usuários do sistema com autenticação
-- =================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role role DEFAULT 'DENTIST',
  color TEXT,
  active BOOLEAN DEFAULT true,
  phone TEXT,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- TABELA: patients
-- Cadastro de pacientes
-- =================================================================
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cpf TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  birth_date DATE,
  gender TEXT,
  address TEXT,
  status TEXT DEFAULT 'Em Tratamento',
  total_approved NUMERIC(10,2) DEFAULT 0,
  total_paid NUMERIC(10,2) DEFAULT 0,
  balance_due NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- TABELA: procedure (SINGULAR - nome correto da tabela)
-- Procedimentos/Serviços oferecidos pela clínica
-- =================================================================
CREATE TABLE IF NOT EXISTS public.procedure (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  base_price NUMERIC(10,2) NOT NULL,
  duration INTEGER NOT NULL,
  total_sessions INTEGER NOT NULL DEFAULT 1,
  duration_min INTEGER DEFAULT 30,
  sessions INTEGER DEFAULT 1,
  code_tuss TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- TABELA: price_tables
-- Tabelas de preços (particular, convênios, etc.)
-- =================================================================
CREATE TABLE IF NOT EXISTS public.price_tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  global_adjustment_percent NUMERIC(5,2) DEFAULT 0.00,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- TABELA: price_table_items
-- Itens de tabela de preços (preços específicos por procedimento)
-- =================================================================
CREATE TABLE IF NOT EXISTS public.price_table_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  price_table_id UUID NOT NULL REFERENCES public.price_tables(id) ON DELETE CASCADE,
  procedure_id UUID NOT NULL REFERENCES public.procedure(id) ON DELETE CASCADE,
  price NUMERIC(10,2) NOT NULL,
  UNIQUE(price_table_id, procedure_id)
);

-- =================================================================
-- TABELA: conventions
-- Convênios/Planos de saúde
-- =================================================================
CREATE TABLE IF NOT EXISTS public.conventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  price_table_id UUID REFERENCES public.price_tables(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'Ativo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =================================================================
-- TABELA: insurance_plans
-- Planos de saúde específicos
-- =================================================================
CREATE TABLE IF NOT EXISTS public.insurance_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  price_table_id UUID NOT NULL REFERENCES public.price_tables(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  active BOOLEAN DEFAULT true
);

-- =================================================================
-- TABELA: budgets
-- Orçamentos de tratamento
-- =================================================================
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  price_table_id UUID REFERENCES public.price_tables(id) ON DELETE SET NULL,
  status budget_status DEFAULT 'DRAFT',
  total_value NUMERIC(10,2) NOT NULL,
  discount NUMERIC(10,2) DEFAULT 0,
  final_value NUMERIC(10,2) NOT NULL,
  payment_config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- TABELA: budget_items
-- Itens de orçamento (procedimentos incluídos no orçamento)
-- =================================================================
CREATE TABLE IF NOT EXISTS public.budget_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES public.procedure(id) ON DELETE SET NULL,
  procedure_name TEXT NOT NULL,
  region TEXT,
  quantity INTEGER DEFAULT 1,
  unit_value NUMERIC(10,2) NOT NULL,
  total_value NUMERIC(10,2) NOT NULL
);

-- =================================================================
-- TABELA: treatment_items
-- Itens de tratamento (procedimentos em execução)
-- =================================================================
CREATE TABLE IF NOT EXISTS public.treatment_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  procedure_name TEXT NOT NULL,
  region TEXT,
  status treatment_status DEFAULT 'NOT_STARTED',
  doctor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  execution_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- =================================================================
-- TABELA: appointments
-- Agendamentos de consultas e procedimentos
-- =================================================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL,
  type appointment_type DEFAULT 'EVALUATION',
  status appointment_status DEFAULT 'PENDING',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- TABELA: leads
-- Leads/Oportunidades de venda (CRM)
-- =================================================================
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  source TEXT NOT NULL,
  status lead_status DEFAULT 'NEW',
  interest TEXT,
  value NUMERIC(10,2),
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  budget_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- TABELA: lead_interactions
-- Histórico de interações com leads
-- =================================================================
CREATE TABLE IF NOT EXISTS public.lead_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- TABELA: lead_tasks
-- Tarefas relacionadas a leads
-- =================================================================
CREATE TABLE IF NOT EXISTS public.lead_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_date DATE NOT NULL,
  completed BOOLEAN DEFAULT false
);

-- =================================================================
-- TABELA: lead_source
-- Origens de leads (customizável por clínica)
-- =================================================================
CREATE TABLE IF NOT EXISTS public.lead_source (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =================================================================
-- TABELA: custom_lead_status
-- Status customizados para leads
-- =================================================================
CREATE TABLE IF NOT EXISTS public.custom_lead_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status_order INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =================================================================
-- TABELA: financial_installments
-- Parcelas financeiras a receber de pacientes
-- =================================================================
CREATE TABLE IF NOT EXISTS public.financial_installments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  due_date DATE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  amount_paid NUMERIC(10,2) DEFAULT 0,
  status payment_status DEFAULT 'PENDING',
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- TABELA: expenses
-- Despesas da clínica
-- =================================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  provider TEXT,
  amount NUMERIC(10,2) NOT NULL,
  amount_paid NUMERIC(10,2) DEFAULT 0,
  due_date DATE NOT NULL,
  status payment_status DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- TABELA: cash_registers
-- Registros de caixa diário
-- =================================================================
CREATE TABLE IF NOT EXISTS public.cash_registers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  opening_balance NUMERIC(10,2) NOT NULL,
  closing_balance NUMERIC(10,2),
  calculated_balance NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL,
  observations TEXT
);

-- =================================================================
-- TABELA: transactions
-- Transações financeiras (entradas e saídas)
-- =================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  cash_register_id UUID REFERENCES public.cash_registers(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  type transaction_type NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  payment_method TEXT NOT NULL,
  expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- TABELA: payment_history
-- Histórico de pagamentos de parcelas
-- =================================================================
CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  installment_id UUID NOT NULL REFERENCES public.financial_installments(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  date DATE NOT NULL,
  method TEXT NOT NULL,
  notes TEXT,
  transaction_id UUID UNIQUE REFERENCES public.transactions(id) ON DELETE SET NULL
);

-- =================================================================
-- TABELA: clinical_notes
-- Notas clínicas/prontuário
-- =================================================================
CREATE TABLE IF NOT EXISTS public.clinical_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- TABELA: document_templates
-- Modelos de documentos (contratos, termos, etc.)
-- =================================================================
CREATE TABLE IF NOT EXISTS public.document_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type document_type NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- TABELA: patient_documents
-- Documentos gerados para pacientes
-- =================================================================
CREATE TABLE IF NOT EXISTS public.patient_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.document_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  type document_type NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'DRAFT',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  signed_at TIMESTAMP WITH TIME ZONE
);

-- =================================================================
-- TABELA: professional_schedules
-- Horários de trabalho dos profissionais
-- =================================================================
CREATE TABLE IF NOT EXISTS public.professional_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL CHECK (day_of_week = ANY (ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])),
  start_time TIME WITHOUT TIME ZONE NOT NULL,
  end_time TIME WITHOUT TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =================================================================
-- TABELAS DE CONFIGURAÇÃO CUSTOMIZÁVEL
-- =================================================================

-- Categorias de despesas customizáveis
CREATE TABLE IF NOT EXISTS public.expense_category (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Categorias de receitas customizáveis
CREATE TABLE IF NOT EXISTS public.revenue_category (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Métodos de pagamento customizáveis
CREATE TABLE IF NOT EXISTS public.payment_method (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =================================================================
-- ÍNDICES PARA PERFORMANCE
-- =================================================================

-- Índices para clinic_id (isolamento multi-tenancy)
CREATE INDEX IF NOT EXISTS idx_users_clinic_id ON public.users(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_clinic_id ON public.patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_procedure_clinic_id ON public.procedure(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON public.appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_leads_clinic_id ON public.leads(clinic_id);
CREATE INDEX IF NOT EXISTS idx_budgets_patient_id ON public.budgets(patient_id);
CREATE INDEX IF NOT EXISTS idx_financial_installments_patient_id ON public.financial_installments(patient_id);
CREATE INDEX IF NOT EXISTS idx_expenses_clinic_id ON public.expenses(clinic_id);
CREATE INDEX IF NOT EXISTS idx_transactions_clinic_id ON public.transactions(clinic_id);

-- Índices para datas e status (queries frequentes)
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_financial_installments_due_date ON public.financial_installments(due_date);
CREATE INDEX IF NOT EXISTS idx_financial_installments_status ON public.financial_installments(status);
CREATE INDEX IF NOT EXISTS idx_expenses_due_date ON public.expenses(due_date);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.expenses(status);

-- =================================================================
-- ROW LEVEL SECURITY (RLS)
-- Isolamento de dados por clínica
-- =================================================================

ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedure ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (exemplo para tabela users)
DROP POLICY IF EXISTS "clinic_isolation" ON public.users;
CREATE POLICY "clinic_isolation" ON public.users 
  FOR ALL USING (clinic_id = (SELECT clinic_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "clinic_isolation" ON public.patients;
CREATE POLICY "clinic_isolation" ON public.patients 
  FOR ALL USING (clinic_id = (SELECT clinic_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF NOT EXISTS "clinic_isolation" ON public.procedure;
CREATE POLICY "clinic_isolation" ON public.procedure 
  FOR ALL USING (clinic_id = (SELECT clinic_id FROM public.users WHERE id = auth.uid()));

-- =================================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =================================================================

COMMENT ON TABLE public.clinics IS 'Dados das clínicas - suporta multi-tenancy';
COMMENT ON TABLE public.users IS 'Usuários do sistema com autenticação Supabase Auth';
COMMENT ON TABLE public.patients IS 'Cadastro de pacientes com dados financeiros agregados';
COMMENT ON TABLE public.procedure IS 'Procedimentos/Serviços oferecidos (SINGULAR)';
COMMENT ON TABLE public.budgets IS 'Orçamentos de tratamento vinculados a pacientes';
COMMENT ON TABLE public.appointments IS 'Agendamentos de consultas e procedimentos';
COMMENT ON TABLE public.leads IS 'Leads/Oportunidades no funil de vendas (CRM)';
COMMENT ON TABLE public.financial_installments IS 'Parcelas a receber de pacientes';
COMMENT ON TABLE public.expenses IS 'Despesas da clínica (contas a pagar)';
COMMENT ON TABLE public.transactions IS 'Transações financeiras (entradas e saídas)';
COMMENT ON TABLE public.cash_registers IS 'Registros de abertura/fechamento de caixa diário';

-- =================================================================
-- FIM DO SCHEMA
-- =================================================================

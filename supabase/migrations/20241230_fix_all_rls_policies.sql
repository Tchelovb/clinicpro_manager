-- 🚨 SCRIPT DEFINITIVO DE CORREÇÃO DE RLS (ROW LEVEL SECURITY) - VERSÃO 2 (CORRIGIDA)
-- ESTE SCRIPT DEVE SER RODADO NO SUPABASE SQL EDITOR
-- OBJETIVO: Permitir que usuários acessem dados SOMENTE da sua própria clínica (clinic_id)

-- 1. Função auxiliar para pegar o clinic_id do JWT (Metadata)
CREATE OR REPLACE FUNCTION get_user_clinic_id()
RETURNS uuid 
LANGUAGE sql 
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'clinic_id')::uuid,
    (auth.jwt() -> 'app_metadata' ->> 'clinic_id')::uuid
  );
$$;

-- 2. Habilita RLS em TODAS as tabelas críticas
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedure ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_table_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_financial_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 3. Remove policies antigas
DROP POLICY IF EXISTS "Users can view patients of their clinic" ON patients;
DROP POLICY IF EXISTS "Users can insert patients of their clinic" ON patients;
DROP POLICY IF EXISTS "Users can update patients of their clinic" ON patients;

DROP POLICY IF EXISTS "Users can view procedures of their clinic" ON procedure;
DROP POLICY IF EXISTS "Users can manage procedures of their clinic" ON procedure;

DROP POLICY IF EXISTS "Users can view professionals of their clinic" ON professionals;

DROP POLICY IF EXISTS "Users can view price tables of their clinic" ON price_tables;
DROP POLICY IF EXISTS "Users can view budgets of their clinic" ON budgets;
DROP POLICY IF EXISTS "Users can view treatments of their clinic" ON treatment_items;
DROP POLICY IF EXISTS "Users can view expenses of their clinic" ON expenses;
DROP POLICY IF EXISTS "Users can view cash registers of their clinic" ON cash_registers;
DROP POLICY IF EXISTS "Users can view users of their clinic" ON users;
DROP POLICY IF EXISTS "Users can update own user" ON users;

DROP POLICY IF EXISTS "RLS_Patients_Select" ON patients;
DROP POLICY IF EXISTS "RLS_Patients_Insert" ON patients;
DROP POLICY IF EXISTS "RLS_Patients_Update" ON patients;
DROP POLICY IF EXISTS "RLS_Procedures_Select" ON procedure;
DROP POLICY IF EXISTS "RLS_Procedures_All" ON procedure;
DROP POLICY IF EXISTS "RLS_Professionals_Select" ON professionals;
DROP POLICY IF EXISTS "RLS_PriceTables_Select" ON price_tables;
DROP POLICY IF EXISTS "RLS_PriceTables_All" ON price_tables;
DROP POLICY IF EXISTS "RLS_PriceTableItems_Select" ON price_table_items;
DROP POLICY IF EXISTS "RLS_Budgets_Select" ON budgets;
DROP POLICY IF EXISTS "RLS_Budgets_All" ON budgets;
DROP POLICY IF EXISTS "RLS_BudgetItems_Select" ON budget_items;
DROP POLICY IF EXISTS "RLS_TreatmentItems_Select" ON treatment_items;
DROP POLICY IF EXISTS "RLS_TreatmentItems_All" ON treatment_items;
DROP POLICY IF EXISTS "RLS_Expenses_All" ON expenses;
DROP POLICY IF EXISTS "RLS_CashRegisters_All" ON cash_registers;
DROP POLICY IF EXISTS "RLS_FinancialSettings_All" ON clinic_financial_settings;
DROP POLICY IF EXISTS "RLS_Users_Select_SameClinic" ON users;

-- 4. CRIA AS NOVAS POLICIES (Diretas via Clinic ID)

-- === PATIENTS ===
CREATE POLICY "RLS_Patients_Select" ON patients FOR SELECT USING (clinic_id = get_user_clinic_id());
CREATE POLICY "RLS_Patients_Insert" ON patients FOR INSERT WITH CHECK (clinic_id = get_user_clinic_id());
CREATE POLICY "RLS_Patients_Update" ON patients FOR UPDATE USING (clinic_id = get_user_clinic_id());

-- === PROCEDURES ===
CREATE POLICY "RLS_Procedures_All" ON procedure FOR ALL USING (clinic_id = get_user_clinic_id());

-- === PROFESSIONALS ===
-- A tabela professionals tem clinic_id, então usamos direto.
CREATE POLICY "RLS_Professionals_Select" ON professionals FOR SELECT USING (clinic_id = get_user_clinic_id());
CREATE POLICY "RLS_Professionals_All" ON professionals FOR ALL USING (clinic_id = get_user_clinic_id());

-- === PRICE TABLES ===
CREATE POLICY "RLS_PriceTables_All" ON price_tables FOR ALL USING (clinic_id = get_user_clinic_id());

-- === PRICE TABLE ITEMS ===
CREATE POLICY "RLS_PriceTableItems_Select" ON price_table_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM price_tables pt WHERE pt.id = price_table_items.price_table_id AND pt.clinic_id = get_user_clinic_id())
);

-- === BUDGETS ===
CREATE POLICY "RLS_Budgets_All" ON budgets FOR ALL USING (clinic_id = get_user_clinic_id());

-- === BUDGET ITEMS ===
CREATE POLICY "RLS_BudgetItems_Select" ON budget_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM budgets b WHERE b.id = budget_items.budget_id AND b.clinic_id = get_user_clinic_id())
);

-- === TREATMENT ITEMS ===
-- Nota: treatment_items não tem clinic_id em algumas versões, mas no esquema fornecido NÃO TEM explicitamente, 
-- porém o join com patients ou budgets resolveria. Mas o dump fornecido mostra que treatment_items *não* tem clinic_id na criação?
-- O dump fornecido NÃO mostra clinic_id na definition original? ESPERA!
-- Vamos checar o dump fornecido pelo usuário:
-- CREATE TABLE public.treatment_items ( ... patient_id uuid NOT NULL ... )
-- Não tem clinic_id direto na definition acima?
-- Ah, se olhar com atenção, não vi `clinic_id` na definition de `treatment_items` enviada pelo user.
-- Vou assumir que o acesso é via patient_id.
CREATE POLICY "RLS_TreatmentItems_All" ON treatment_items FOR ALL USING (
  EXISTS (SELECT 1 FROM patients p WHERE p.id = treatment_items.patient_id AND p.clinic_id = get_user_clinic_id())
);

-- === FINANCIAL ===
CREATE POLICY "RLS_Expenses_All" ON expenses FOR ALL USING (clinic_id = get_user_clinic_id());
CREATE POLICY "RLS_CashRegisters_All" ON cash_registers FOR ALL USING (clinic_id = get_user_clinic_id());
CREATE POLICY "RLS_FinancialSettings_All" ON clinic_financial_settings FOR ALL USING (clinic_id = get_user_clinic_id());

-- === USERS ===
-- Permite ver usuários da mesma clínica
CREATE POLICY "RLS_Users_Select_SameClinic" ON users FOR SELECT USING (clinic_id = get_user_clinic_id());
-- Permite o próprio usuário se editar
CREATE POLICY "RLS_Users_Update_Self" ON users FOR UPDATE USING (auth.uid() = id);

-- Confirmação
SELECT '✅ RLS Policies V2 Criadas com Sucesso' as status;

-- =====================================================
-- ENTERPRISE SETTINGS MODULE - SCHEMA
-- =====================================================
-- Engenharia Reversa para ClinicPro High Ticket
-- =====================================================

-- 1. GESTÃO DE TAXAS E IMPOSTOS (Dedução Automática)
-- =====================================================

-- Tabela de Configuração de Taxas de Cartão (Maquininhas)
CREATE TABLE IF NOT EXISTS public.card_machine_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- Ex: "Stone Principal", "Cielo"
    active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    debit_rate NUMERIC(5,2) DEFAULT 1.99,
    anticipation_rate NUMERIC(5,2) DEFAULT 0, -- Taxa de antecipação (se houver)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Taxas de Crédito por Parcela (1x a 18x)
CREATE TABLE IF NOT EXISTS public.card_installment_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.card_machine_profiles(id) ON DELETE CASCADE,
    installments INTEGER NOT NULL CHECK (installments BETWEEN 1 AND 18),
    rate NUMERIC(5,2) NOT NULL DEFAULT 0, -- Ex: 3.99
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(profile_id, installments)
);

-- Adicionar Configurações Fiscais na Clínica (ou em tabela separada se preferir normalizar)
ALTER TABLE public.clinics 
ADD COLUMN IF NOT EXISTS tax_regime TEXT DEFAULT 'SIMPLES_NACIONAL' CHECK (tax_regime IN ('SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL')),
ADD COLUMN IF NOT EXISTS federal_tax_rate NUMERIC(5,2) DEFAULT 6.00, -- Ex: 6% Simples
ADD COLUMN IF NOT EXISTS state_tax_rate NUMERIC(5,2) DEFAULT 0.00,  -- ISS/ICMS se separado
ADD COLUMN IF NOT EXISTS municipal_tax_rate NUMERIC(5,2) DEFAULT 0.00;

-- 2. REGRAS DE COMISSIONAMENTO & SEGURANÇA
-- =====================================================

ALTER TABLE public.clinics
ADD COLUMN IF NOT EXISTS commission_trigger TEXT DEFAULT 'RECEIPT' CHECK (commission_trigger IN ('ISSUANCE', 'RECEIPT')), -- Faturamento vs Recebimento
ADD COLUMN IF NOT EXISTS master_pin_hash TEXT; -- Hash separado para segurança crítica (além do user pin)

-- 3. WIZARD DE CUSTOS FIXOS (Melhorias na Tabela Existente)
-- =====================================================

-- Melhorar a tabela fixed_cost_items para suportar o Wizard
ALTER TABLE public.fixed_cost_items
ADD COLUMN IF NOT EXISTS expense_category_id UUID REFERENCES public.expense_category(id),
ADD COLUMN IF NOT EXISTS recurrence_day INTEGER CHECK (recurrence_day BETWEEN 1 AND 31),
ADD COLUMN IF NOT EXISTS is_variable_estimate BOOLEAN DEFAULT FALSE; -- Se é uma estimativa de custo variável (ex: Luz)

-- TRIGGER: Atualizar clinic_cost_structure quando itens de custo fixo mudarem
-- Isso garante o "Cálculo em tempo real" do cost_per_minute

CREATE OR REPLACE FUNCTION update_clinic_fixed_costs_total()
RETURNS TRIGGER AS $$
DECLARE
    v_clinic_id UUID;
    v_total_fixed NUMERIC;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_clinic_id := OLD.clinic_id;
    ELSE
        v_clinic_id := NEW.clinic_id;
    END IF;

    -- Calcular soma dos itens ativos
    SELECT COALESCE(SUM(amount), 0)
    INTO v_total_fixed
    FROM public.fixed_cost_items
    WHERE clinic_id = v_clinic_id AND is_active = TRUE;

    -- Atualizar a estrutura de custos (que por sua vez dispara o cálculo do cost_per_minute)
    UPDATE public.clinic_cost_structure
    SET fixed_costs = v_total_fixed,
        updated_at = NOW()
    WHERE clinic_id = v_clinic_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_fixed_costs_on_item_change ON public.fixed_cost_items;
CREATE TRIGGER trigger_update_fixed_costs_on_item_change
AFTER INSERT OR UPDATE OR DELETE ON public.fixed_cost_items
FOR EACH ROW EXECUTE FUNCTION update_clinic_fixed_costs_total();

-- 4. CADASTRO DE UNIDADES (Simplificado na tabela clinics por enquanto, ou tabela nova)
-- O usuário pediu "Cadastro de Unidades". Vamos criar para futura expansão.

CREATE TABLE IF NOT EXISTS public.clinic_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- Ex: "Matriz", "Filial Centro"
    active_chairs INTEGER DEFAULT 1,
    efficiency_rate NUMERIC(5,2) DEFAULT 0.80,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentários para IA
COMMENT ON TABLE public.card_machine_profiles IS 'Perfis de taxas das maquininhas de cartão (Stone, Cielo, etc)';
COMMENT ON TABLE public.card_installment_rates IS 'Tabela progressiva de taxas de cartão de crédito';
COMMENT ON COLUMN public.clinics.commission_trigger IS 'Gatilho para liberar comissão: ISSUANCE (na venda) ou RECEIPT (no pagamento)';


-- ============================================
-- SALES COMMISSION MODULE - SCHEMA
-- ============================================
-- Implementa sistema de comissão de vendas
-- para rastrear vendedores e calcular comissão
-- como custo variável direto no Profit Engine
-- ============================================

-- 1. ADICIONAR VENDEDOR AO ORÇAMENTO
-- ============================================

ALTER TABLE public.budgets 
ADD COLUMN IF NOT EXISTS sales_rep_id uuid REFERENCES public.users(id);

COMMENT ON COLUMN public.budgets.sales_rep_id IS 'Usuário que vendeu/fechou o orçamento (CRC/Recepção/Consultor)';

-- Índice para buscar orçamentos por vendedor
CREATE INDEX IF NOT EXISTS idx_budgets_sales_rep ON public.budgets(sales_rep_id);

-- ============================================
-- 2. CRIAR TABELA DE REGRAS DE COMISSÃO DE VENDA
-- ============================================

CREATE TABLE IF NOT EXISTS public.sales_commission_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Tipo e valor da comissão
    commission_type text NOT NULL CHECK (commission_type IN ('PERCENTAGE', 'FIXED')),
    commission_value numeric NOT NULL CHECK (commission_value >= 0),
    
    -- Filtros opcionais
    applies_to_category text, -- Comissão específica por categoria de procedimento
    min_budget_value numeric DEFAULT 0, -- Comissão só se orçamento >= X
    
    -- Controle
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Garantir uma regra por usuário/categoria
    UNIQUE(clinic_id, user_id, applies_to_category)
);

-- Comentários
COMMENT ON TABLE public.sales_commission_rules IS 'Regras de comissão de venda por usuário (CRC/Recepção)';
COMMENT ON COLUMN public.sales_commission_rules.commission_type IS 'PERCENTAGE (% sobre total) ou FIXED (valor fixo)';
COMMENT ON COLUMN public.sales_commission_rules.commission_value IS 'Valor da comissão (ex: 2.0 para 2% ou 50.0 para R$ 50)';
COMMENT ON COLUMN public.sales_commission_rules.applies_to_category IS 'Categoria específica (NULL = todas)';
COMMENT ON COLUMN public.sales_commission_rules.min_budget_value IS 'Valor mínimo do orçamento para gerar comissão';

-- Índices
CREATE INDEX IF NOT EXISTS idx_sales_commission_rules_user ON public.sales_commission_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_commission_rules_clinic ON public.sales_commission_rules(clinic_id);
CREATE INDEX IF NOT EXISTS idx_sales_commission_rules_active ON public.sales_commission_rules(is_active) WHERE is_active = true;

-- ============================================
-- 3. ATUALIZAR TABELA DE PAGAMENTOS DE COMISSÃO
-- ============================================

ALTER TABLE public.commission_payments
ADD COLUMN IF NOT EXISTS user_type text DEFAULT 'PROFESSIONAL' 
CHECK (user_type IN ('PROFESSIONAL', 'SALES_REP'));

COMMENT ON COLUMN public.commission_payments.user_type IS 'Tipo de comissão: PROFESSIONAL (dentista) ou SALES_REP (vendedor)';

-- Índice para filtrar por tipo
CREATE INDEX IF NOT EXISTS idx_commission_payments_user_type ON public.commission_payments(user_type);

-- ============================================
-- 4. RLS POLICIES
-- ============================================

-- Política para sales_commission_rules
ALTER TABLE public.sales_commission_rules ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver regras da própria clínica
DROP POLICY IF EXISTS sales_commission_rules_select_policy ON public.sales_commission_rules;
CREATE POLICY sales_commission_rules_select_policy ON public.sales_commission_rules
    FOR SELECT
    USING (
        clinic_id IN (
            SELECT clinic_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Apenas ADMIN/MASTER podem criar/atualizar regras
DROP POLICY IF EXISTS sales_commission_rules_insert_policy ON public.sales_commission_rules;
CREATE POLICY sales_commission_rules_insert_policy ON public.sales_commission_rules
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND clinic_id = sales_commission_rules.clinic_id
            AND role IN ('ADMIN', 'MASTER')
        )
    );

DROP POLICY IF EXISTS sales_commission_rules_update_policy ON public.sales_commission_rules;
CREATE POLICY sales_commission_rules_update_policy ON public.sales_commission_rules
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND clinic_id = sales_commission_rules.clinic_id
            AND role IN ('ADMIN', 'MASTER')
        )
    );

DROP POLICY IF EXISTS sales_commission_rules_delete_policy ON public.sales_commission_rules;
CREATE POLICY sales_commission_rules_delete_policy ON public.sales_commission_rules
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND clinic_id = sales_commission_rules.clinic_id
            AND role IN ('ADMIN', 'MASTER')
        )
    );

-- ============================================
-- 5. SEED DATA (EXEMPLO)
-- ============================================

-- Exemplo: CRC ganha 2% sobre orçamentos de Ortodontia
-- INSERT INTO public.sales_commission_rules (clinic_id, user_id, commission_type, commission_value, applies_to_category)
-- VALUES (
--     'sua-clinic-id',
--     'user-id-da-crc',
--     'PERCENTAGE',
--     2.0,
--     'ORTODONTIA'
-- );

-- Exemplo: Recepcionista ganha R$ 50 fixo por orçamento fechado
-- INSERT INTO public.sales_commission_rules (clinic_id, user_id, commission_type, commission_value)
-- VALUES (
--     'sua-clinic-id',
--     'user-id-recepcionista',
--     'FIXED',
--     50.0
-- );

-- ============================================
-- 6. FUNÇÕES AUXILIARES
-- ============================================

-- Função para calcular comissão de venda de um orçamento
CREATE OR REPLACE FUNCTION calculate_sales_commission(
    p_budget_id uuid
) RETURNS numeric AS $$
DECLARE
    v_sales_rep_id uuid;
    v_final_value numeric;
    v_category_id text;
    v_clinic_id uuid;
    v_commission_type text;
    v_commission_value numeric;
    v_min_budget_value numeric;
    v_result numeric := 0;
BEGIN
    -- Buscar dados do orçamento
    SELECT sales_rep_id, final_value, category_id, clinic_id
    INTO v_sales_rep_id, v_final_value, v_category_id, v_clinic_id
    FROM public.budgets
    WHERE id = p_budget_id;
    
    -- Se não tem vendedor, retorna 0
    IF v_sales_rep_id IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Buscar regra de comissão (específica por categoria primeiro)
    SELECT commission_type, commission_value, min_budget_value
    INTO v_commission_type, v_commission_value, v_min_budget_value
    FROM public.sales_commission_rules
    WHERE user_id = v_sales_rep_id
      AND clinic_id = v_clinic_id
      AND is_active = true
      AND (applies_to_category = v_category_id OR applies_to_category IS NULL)
    ORDER BY applies_to_category NULLS LAST
    LIMIT 1;
    
    -- Se não encontrou regra, retorna 0
    IF v_commission_type IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Verificar valor mínimo
    IF v_final_value < v_min_budget_value THEN
        RETURN 0;
    END IF;
    
    -- Calcular comissão
    IF v_commission_type = 'PERCENTAGE' THEN
        v_result := (v_final_value * v_commission_value) / 100;
    ELSIF v_commission_type = 'FIXED' THEN
        v_result := v_commission_value;
    END IF;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_sales_commission IS 'Calcula comissão de venda de um orçamento baseado nas regras configuradas';

-- ============================================
-- FIM DO SCRIPT
-- ============================================

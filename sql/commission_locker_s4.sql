-- ============================================
-- S4 SENTINEL: COMMISSION LOCKER
-- ============================================
-- Objetivo: Só permitir pagamento de comissão quando a parcela for PAGA.
-- Lógica: Comissão Disponível = (Comissão Total / Qtd Parcelas) * Qtd Parcelas Pagas
-- ============================================

-- View para calcular comissão "Desbloqueada" por Profissional
CREATE OR REPLACE VIEW public.view_unlocked_commissions AS
WITH budget_commission_totals AS (
    -- 1. Calcular o total de comissão devida por orçamento
    -- (Simplificação: Soma das comissões dos itens ou valor do orçamento * %)
    -- Aqui assumimos uma coluna 'total_commission_value' ou calculamos on-the-fly dos itens
    SELECT 
        b.id AS budget_id,
        b.doctor_id,
        b.patient_id,
        b.installments_count,
        -- Exemplo: 50% do valor final é procedimentos, e doutor ganha 40% disso.
        -- Para MVP, vamos usar um 'estimated_commission' baseada em regras genéricas se não tivermos os itens
        -- Mas idealmente usaríamos a soma de budget_items.
        COALESCE((
            SELECT SUM(bi.unit_value * bi.quantity * 0.40) -- 40% padrão de comissão (exemplo)
            FROM public.budget_items bi 
            WHERE bi.budget_id = b.id
        ), 0) AS total_commission_potential
    FROM public.budgets b
    WHERE b.status = 'APPROVED'
),
installment_progress AS (
    -- 2. Calcular progresso do pagamento (Quantas parcelas foram pagas?)
    SELECT 
        i.budget_id,
        COUNT(*) AS total_installments,
        COUNT(*) FILTER (WHERE i.status = 'PAID') AS paid_installments
    FROM public.installments i
    GROUP BY i.budget_id
)
SELECT 
    bct.doctor_id,
    bct.budget_id,
    bct.patient_id,
    bct.total_commission_potential,
    ip.total_installments,
    ip.paid_installments,
    -- CÁLCULO MÁGICO DO LOCKER:
    CASE 
        WHEN ip.total_installments = 0 THEN 0
        ELSE (bct.total_commission_potential / ip.total_installments) * ip.paid_installments
    END AS unlocked_commission_value
FROM budget_commission_totals bct
JOIN installment_progress ip ON ip.budget_id = bct.budget_id;

-- ============================================
-- 3. Função para Buscar Saldo Disponível
-- ============================================
CREATE OR REPLACE FUNCTION public.get_professional_balance(p_doctor_id uuid)
RETURNS numeric AS $$
DECLARE
    v_balance numeric;
BEGIN
    SELECT SUM(unlocked_commission_value)
    INTO v_balance
    FROM public.view_unlocked_commissions
    WHERE doctor_id = p_doctor_id;
    
    RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON VIEW public.view_unlocked_commissions IS 'Calcula comissão desbloqueada proporcionalmente às parcelas pagas (S4 Locker)';

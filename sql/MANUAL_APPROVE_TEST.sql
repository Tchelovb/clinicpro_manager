-- =====================================================
-- TESTE MANUAL: Aprovar Orçamento e Verificar Trigger
-- =====================================================

-- PASSO 1: Aprovar o orçamento manualmente
UPDATE budgets
SET 
    status = 'APPROVED',
    updated_at = NOW()
WHERE id = '22ac833e-3ad8-4f87-810a-ae9b07910e63';

-- PASSO 2: Verificar se o orçamento foi aprovado
SELECT 
    id,
    status,
    updated_at
FROM budgets
WHERE id = '22ac833e-3ad8-4f87-810a-ae9b07910e63';

-- PASSO 3: Verificar se treatment_items foram criados pelo trigger
SELECT 
    ti.id,
    ti.procedure_name,
    ti.category,
    ti.specialty,
    ti.status,
    ti.unit_value,
    ti.total_value,
    ti.created_at
FROM treatment_items ti
WHERE ti.budget_id = '22ac833e-3ad8-4f87-810a-ae9b07910e63'
ORDER BY ti.created_at;

-- PASSO 4: Verificar se installments foram criadas pelo trigger
SELECT 
    i.id,
    i.installment_number,
    i.total_installments,
    i.amount,
    i.due_date,
    i.status,
    i.created_at
FROM installments i
WHERE i.budget_id = '22ac833e-3ad8-4f87-810a-ae9b07910e63'
ORDER BY i.installment_number;

-- PASSO 5: Se não houver treatment_items, verificar os budget_items
SELECT 
    bi.id,
    bi.procedure_name,
    bi.quantity,
    bi.unit_value,
    bi.total_value
FROM budget_items bi
WHERE bi.budget_id = '22ac833e-3ad8-4f87-810a-ae9b07910e63';

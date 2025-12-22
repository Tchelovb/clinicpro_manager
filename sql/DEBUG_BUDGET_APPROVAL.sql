-- =====================================================
-- DEBUG: Verificar Aprovação de Orçamento
-- =====================================================

-- 1. Verificar o orçamento específico
SELECT 
    id,
    patient_id,
    status,
    total_value,
    final_value,
    created_at,
    updated_at
FROM budgets
WHERE id = '22ac833e-3ad8-4f87-810a-ae9b07910e63';

-- 2. Verificar se há treatment_items criados
SELECT 
    ti.id,
    ti.procedure_name,
    ti.category,
    ti.specialty,
    ti.status,
    ti.total_value,
    ti.created_at
FROM treatment_items ti
WHERE ti.budget_id = '22ac833e-3ad8-4f87-810a-ae9b07910e63';

-- 3. Verificar se há installments criadas
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

-- 4. Verificar se o trigger existe e está ativo
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'auto_create_treatment_and_installments';

-- 5. Tentar aprovar manualmente (TESTE)
-- CUIDADO: Isso vai realmente aprovar o orçamento!
-- Descomente apenas se quiser testar manualmente

/*
UPDATE budgets
SET status = 'APPROVED'
WHERE id = '22ac833e-3ad8-4f87-810a-ae9b07910e63';
*/

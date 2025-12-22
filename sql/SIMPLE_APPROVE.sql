-- Execute este script completo de uma vez no Supabase SQL Editor

-- 1. Aprovar o orçamento
UPDATE budgets
SET status = 'APPROVED'
WHERE id = '22ac833e-3ad8-4f87-810a-ae9b07910e63';

-- 2. Verificar status do orçamento
SELECT 'Status do Orçamento:' as resultado;
SELECT id, status, final_value FROM budgets WHERE id = '22ac833e-3ad8-4f87-810a-ae9b07910e63';

-- 3. Verificar treatment_items criados
SELECT 'Treatment Items Criados:' as resultado;
SELECT id, procedure_name, category, specialty, total_value FROM treatment_items WHERE budget_id = '22ac833e-3ad8-4f87-810a-ae9b07910e63';

-- 4. Verificar installments criadas
SELECT 'Parcelas Criadas:' as resultado;
SELECT id, installment_number, amount, due_date, status FROM installments WHERE budget_id = '22ac833e-3ad8-4f87-810a-ae9b07910e63' ORDER BY installment_number;

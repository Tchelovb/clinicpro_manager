-- =====================================================
-- TESTE COMPLETO: Aprovar e Verificar
-- =====================================================

-- PASSO 1: Aprovar o orçamento
UPDATE budgets
SET 
    status = 'APPROVED',
    updated_at = NOW()
WHERE id = '22ac833e-3ad8-4f87-810a-ae9b07910e63';

-- PASSO 2: Aguardar trigger executar
SELECT pg_sleep(1);

-- PASSO 3: Verificar TUDO de uma vez
SELECT 
    'BUDGET' as tipo,
    b.id::text,
    b.status::text as info,
    NULL::text as numero,
    NULL::text as valor
FROM budgets b
WHERE b.id = '22ac833e-3ad8-4f87-810a-ae9b07910e63'

UNION ALL

SELECT 
    'TREATMENT_ITEM' as tipo,
    ti.id::text,
    ti.procedure_name::text as info,
    NULL::text as numero,
    ti.total_value::text as valor
FROM treatment_items ti
WHERE ti.budget_id = '22ac833e-3ad8-4f87-810a-ae9b07910e63'

UNION ALL

SELECT 
    'INSTALLMENT' as tipo,
    i.id::text,
    i.status::text as info,
    i.installment_number::text as numero,
    i.amount::text as valor
FROM installments i
WHERE i.budget_id = '22ac833e-3ad8-4f87-810a-ae9b07910e63'
ORDER BY tipo, numero;

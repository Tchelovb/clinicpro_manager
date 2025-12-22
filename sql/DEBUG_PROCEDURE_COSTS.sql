-- =====================================================
-- DEBUG: Verificar Relacionamento procedure_costs
-- =====================================================
-- Este script verifica se os custos estão sendo salvos
-- e se o relacionamento está funcionando corretamente
-- =====================================================

-- 1. Verificar se existem custos salvos
DO $$
DECLARE
    total_procedures integer;
    total_costs integer;
BEGIN
    SELECT COUNT(*) INTO total_procedures FROM public.procedure;
    SELECT COUNT(*) INTO total_costs FROM public.procedure_costs;
    
    RAISE NOTICE '=== VERIFICAÇÃO DE DADOS ===';
    RAISE NOTICE 'Total de Procedimentos: %', total_procedures;
    RAISE NOTICE 'Total de Custos Salvos: %', total_costs;
    RAISE NOTICE '';
END $$;

-- 2. Mostrar os últimos 5 custos salvos
DO $$
BEGIN
    RAISE NOTICE '=== ÚLTIMOS 5 CUSTOS SALVOS ===';
END $$;

SELECT 
    pc.id,
    p.name as procedure_name,
    pc.material_cost,
    pc.professional_cost,
    pc.operational_overhead,
    pc.total_cost,
    pc.updated_at
FROM public.procedure_costs pc
JOIN public.procedure p ON p.id = pc.procedure_id
ORDER BY pc.updated_at DESC
LIMIT 5;

-- 3. Testar a query que o frontend usa
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TESTE DA QUERY DO FRONTEND ===';
    RAISE NOTICE 'Simulando: SELECT *, procedure_costs(...) FROM procedure';
END $$;

SELECT 
    p.id,
    p.name,
    p.category,
    p.specialty,
    p.base_price,
    json_agg(
        json_build_object(
            'material_cost', pc.material_cost,
            'professional_cost', pc.professional_cost,
            'operational_overhead', pc.operational_overhead,
            'total_cost', pc.total_cost
        )
    ) FILTER (WHERE pc.id IS NOT NULL) as procedure_costs
FROM public.procedure p
LEFT JOIN public.procedure_costs pc ON pc.procedure_id = p.id
WHERE p.clinic_id = (SELECT id FROM public.clinics LIMIT 1)
GROUP BY p.id, p.name, p.category, p.specialty, p.base_price
ORDER BY p.name
LIMIT 10;

-- 4. Verificar se há algum procedimento sem custos
DO $$
DECLARE
    procedures_without_costs integer;
BEGIN
    SELECT COUNT(*) INTO procedures_without_costs
    FROM public.procedure p
    LEFT JOIN public.procedure_costs pc ON pc.procedure_id = p.id
    WHERE pc.id IS NULL;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== PROCEDIMENTOS SEM CUSTOS ===';
    RAISE NOTICE 'Total: %', procedures_without_costs;
END $$;

-- 5. Mostrar procedimentos sem custos
SELECT 
    p.id,
    p.name,
    p.category,
    p.base_price,
    'SEM CUSTOS' as status
FROM public.procedure p
LEFT JOIN public.procedure_costs pc ON pc.procedure_id = p.id
WHERE pc.id IS NULL
ORDER BY p.name
LIMIT 10;

-- 6. Verificar constraints e índices
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== CONSTRAINTS E ÍNDICES ===';
END $$;

SELECT
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.procedure_costs'::regclass
ORDER BY contype, conname;

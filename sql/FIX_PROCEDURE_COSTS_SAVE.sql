-- =====================================================
-- FIX: Salvamento de Custos e Margem BOS
-- =====================================================
-- Este script corrige problemas no salvamento dos custos
-- de procedimentos (Custo Materiais, Profissional, Operacional)
-- =====================================================

-- 1. Verificar estrutura atual da tabela procedure_costs
DO $$
BEGIN
    RAISE NOTICE '=== VERIFICANDO ESTRUTURA DA TABELA procedure_costs ===';
END $$;

-- 2. Verificar se existe constraint UNIQUE em procedure_id
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'procedure_costs_procedure_id_key'
    ) INTO constraint_exists;
    
    IF constraint_exists THEN
        RAISE NOTICE '✓ Constraint UNIQUE em procedure_id existe';
    ELSE
        RAISE NOTICE '✗ Constraint UNIQUE em procedure_id NÃO existe - será criada';
        
        -- Criar constraint se não existir
        ALTER TABLE public.procedure_costs
        ADD CONSTRAINT procedure_costs_procedure_id_key UNIQUE (procedure_id);
        
        RAISE NOTICE '✓ Constraint UNIQUE criada com sucesso';
    END IF;
END $$;

-- 3. Verificar e corrigir coluna total_cost (deve ser GENERATED)
DO $$
DECLARE
    view_exists BOOLEAN;
    view_definition TEXT;
BEGIN
    -- Verificar se a view view_unit_economics existe
    SELECT EXISTS (
        SELECT 1 FROM pg_views WHERE viewname = 'view_unit_economics'
    ) INTO view_exists;
    
    IF view_exists THEN
        -- Salvar a definição da view antes de dropar
        SELECT pg_get_viewdef('view_unit_economics', true) INTO view_definition;
        
        RAISE NOTICE '⚠ View view_unit_economics encontrada - será recriada';
        
        -- Dropar a view temporariamente
        DROP VIEW IF EXISTS view_unit_economics CASCADE;
        
        RAISE NOTICE '✓ View removida temporariamente';
    END IF;
    
    -- Verificar se total_cost já é uma coluna gerada
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'procedure_costs' 
        AND column_name = 'total_cost'
        AND is_generated = 'NEVER'
    ) THEN
        -- É uma coluna normal, precisa ser recriada
        ALTER TABLE public.procedure_costs DROP COLUMN total_cost;
        
        ALTER TABLE public.procedure_costs
        ADD COLUMN total_cost numeric GENERATED ALWAYS AS (
            COALESCE(material_cost, 0) + 
            COALESCE(professional_cost, 0) + 
            COALESCE(operational_overhead, 0)
        ) STORED;
        
        RAISE NOTICE '✓ Coluna total_cost reconfigurada como GENERATED COLUMN';
    ELSIF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'procedure_costs' 
        AND column_name = 'total_cost'
    ) THEN
        RAISE NOTICE '✓ Coluna total_cost já está configurada como GENERATED COLUMN';
    ELSE
        -- Coluna não existe, criar
        ALTER TABLE public.procedure_costs
        ADD COLUMN total_cost numeric GENERATED ALWAYS AS (
            COALESCE(material_cost, 0) + 
            COALESCE(professional_cost, 0) + 
            COALESCE(operational_overhead, 0)
        ) STORED;
        
        RAISE NOTICE '✓ Coluna total_cost criada como GENERATED COLUMN';
    END IF;
    
    -- Recriar a view se ela existia
    IF view_exists AND view_definition IS NOT NULL THEN
        EXECUTE 'CREATE OR REPLACE VIEW view_unit_economics AS ' || view_definition;
        RAISE NOTICE '✓ View view_unit_economics recriada';
    END IF;
END $$;

-- 4. Garantir que todas as colunas de custo tenham valores padrão
-- NOTA: Não alterar colunas geradas (total_cost, comission_cost)
ALTER TABLE public.procedure_costs
ALTER COLUMN material_cost SET DEFAULT 0,
ALTER COLUMN professional_cost SET DEFAULT 0,
ALTER COLUMN operational_overhead SET DEFAULT 0,
ALTER COLUMN tax_percent SET DEFAULT 0,
ALTER COLUMN card_fee_percent SET DEFAULT 0;

-- 5. Atualizar valores NULL para 0 (apenas colunas não-geradas)
UPDATE public.procedure_costs
SET 
    material_cost = COALESCE(material_cost, 0),
    professional_cost = COALESCE(professional_cost, 0),
    operational_overhead = COALESCE(operational_overhead, 0),
    tax_percent = COALESCE(tax_percent, 0),
    card_fee_percent = COALESCE(card_fee_percent, 0);

-- 6. Verificar políticas RLS
DO $$
BEGIN
    RAISE NOTICE '=== VERIFICANDO POLÍTICAS RLS ===';
    
    -- As políticas já foram criadas pelo script FIX_PROCEDURE_RLS.sql
    -- Apenas confirmar que existem
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'procedure_costs' 
        AND policyname = 'Enable insert for authenticated users'
    ) THEN
        RAISE NOTICE '✓ Políticas RLS estão ativas';
    ELSE
        RAISE NOTICE '⚠ Execute o script FIX_PROCEDURE_RLS.sql primeiro';
    END IF;
END $$;

-- 7. Teste de inserção/atualização
DO $$
DECLARE
    test_clinic_id uuid;
    test_procedure_id uuid;
BEGIN
    RAISE NOTICE '=== EXECUTANDO TESTE DE UPSERT ===';
    
    -- Pegar IDs de teste (primeiro procedimento da primeira clínica)
    SELECT clinic_id, id INTO test_clinic_id, test_procedure_id
    FROM public.procedure
    LIMIT 1;
    
    IF test_procedure_id IS NOT NULL THEN
        -- Tentar fazer upsert
        INSERT INTO public.procedure_costs (
            clinic_id,
            procedure_id,
            material_cost,
            professional_cost,
            operational_overhead
        ) VALUES (
            test_clinic_id,
            test_procedure_id,
            100.00,
            200.00,
            50.00
        )
        ON CONFLICT (procedure_id) 
        DO UPDATE SET
            material_cost = EXCLUDED.material_cost,
            professional_cost = EXCLUDED.professional_cost,
            operational_overhead = EXCLUDED.operational_overhead,
            updated_at = now();
        
        RAISE NOTICE '✓ Teste de UPSERT executado com sucesso';
        RAISE NOTICE '  - Procedure ID: %', test_procedure_id;
        RAISE NOTICE '  - Total Cost calculado automaticamente';
    ELSE
        RAISE NOTICE '⚠ Nenhum procedimento encontrado para teste';
    END IF;
END $$;

-- 8. Resumo final
DO $$
DECLARE
    total_procedures integer;
    procedures_with_costs integer;
    procedures_without_costs integer;
BEGIN
    SELECT COUNT(*) INTO total_procedures FROM public.procedure;
    SELECT COUNT(*) INTO procedures_with_costs FROM public.procedure_costs;
    procedures_without_costs := total_procedures - procedures_with_costs;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== RESUMO FINAL ===';
    RAISE NOTICE 'Total de Procedimentos: %', total_procedures;
    RAISE NOTICE 'Procedimentos com Custos: %', procedures_with_costs;
    RAISE NOTICE 'Procedimentos sem Custos: %', procedures_without_costs;
    RAISE NOTICE '';
    RAISE NOTICE '✓ Script executado com sucesso!';
    RAISE NOTICE '✓ Agora você pode salvar custos no módulo de Procedimentos';
END $$;

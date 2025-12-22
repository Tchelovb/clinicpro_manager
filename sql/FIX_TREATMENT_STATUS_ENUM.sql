-- =====================================================
-- FIX: Treatment Status Enum - Add Missing Values
-- =====================================================
-- Este script corrige o erro: invalid input value for enum treatment_status: "CONCLUDED"
-- Executar APENAS UMA VEZ no Supabase SQL Editor

-- 1. Verificar valores atuais do enum
DO $$
BEGIN
    RAISE NOTICE 'Valores atuais do enum treatment_status:';
    RAISE NOTICE '%', (SELECT array_agg(enumlabel::text) FROM pg_enum WHERE enumtypid = 'treatment_status'::regtype);
END $$;

-- 2. Adicionar valor 'CONCLUDED' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = 'treatment_status'::regtype 
        AND enumlabel = 'CONCLUDED'
    ) THEN
        ALTER TYPE treatment_status ADD VALUE 'CONCLUDED';
        RAISE NOTICE '✅ Valor CONCLUDED adicionado ao enum treatment_status';
    ELSE
        RAISE NOTICE '⚠️ Valor CONCLUDED já existe no enum';
    END IF;
END $$;

-- 3. Adicionar valor 'COMPLETED' se não existir (alternativa)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = 'treatment_status'::regtype 
        AND enumlabel = 'COMPLETED'
    ) THEN
        ALTER TYPE treatment_status ADD VALUE 'COMPLETED';
        RAISE NOTICE '✅ Valor COMPLETED adicionado ao enum treatment_status';
    ELSE
        RAISE NOTICE '⚠️ Valor COMPLETED já existe no enum';
    END IF;
END $$;

-- 4. Verificar novamente
DO $$
BEGIN
    RAISE NOTICE 'Valores finais do enum treatment_status:';
    RAISE NOTICE '%', (SELECT array_agg(enumlabel::text) FROM pg_enum WHERE enumtypid = 'treatment_status'::regtype);
END $$;

-- =====================================================
-- EXECUTAR ESTE SCRIPT NO SUPABASE SQL EDITOR
-- =====================================================

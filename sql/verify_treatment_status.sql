-- =====================================================
-- VERIFICAR E CORRIGIR ENUM treatment_status
-- =====================================================

-- 1. Ver os valores atuais do enum
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'treatment_status'::regtype
ORDER BY enumsortorder;

-- 2. Se necessário, adicionar valores faltantes
-- (Execute apenas se os valores não existirem)

-- ALTER TYPE treatment_status ADD VALUE IF NOT EXISTS 'NOT_STARTED';
-- ALTER TYPE treatment_status ADD VALUE IF NOT EXISTS 'IN_PROGRESS';
-- ALTER TYPE treatment_status ADD VALUE IF NOT EXISTS 'COMPLETED';

-- 3. Verificar tratamentos existentes
SELECT 
    id,
    procedure_name,
    status,
    created_at
FROM treatment_items
ORDER BY created_at DESC
LIMIT 10;

-- 4. Se os valores do enum estiverem diferentes, 
-- precisaremos atualizar o código React para usar os valores corretos
-- Valores possíveis comuns:
-- - PLANNED, IN_PROGRESS, COMPLETED
-- - NOT_STARTED, IN_PROGRESS, COMPLETED  
-- - PENDING, IN_PROGRESS, DONE

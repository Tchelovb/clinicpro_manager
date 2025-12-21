-- ============================================
-- ADICIONAR COLUNA TYPE NA TABELA CLINICS
-- BOS v24.0 - Suporte Multi-Tenant
-- ============================================

-- 1. CRIAR ENUM PARA TIPO DE CLÍNICA
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'clinic_type') THEN
        CREATE TYPE clinic_type AS ENUM ('PRODUCTION', 'REAL', 'SIMULATION');
    END IF;
END $$;

-- 2. ADICIONAR COLUNA TYPE NA TABELA CLINICS
ALTER TABLE clinics 
ADD COLUMN IF NOT EXISTS type clinic_type DEFAULT 'PRODUCTION';

-- 3. ATUALIZAR CLÍNICAS EXISTENTES
-- Todas as clínicas existentes serão marcadas como PRODUCTION
UPDATE clinics 
SET type = 'PRODUCTION' 
WHERE type IS NULL;

-- 4. CRIAR ÍNDICE PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_clinics_type ON clinics(type);

-- 5. VERIFICAR RESULTADO
SELECT 
    id,
    name,
    code,
    type,
    status,
    created_at
FROM clinics
ORDER BY created_at DESC;

-- ============================================
-- RESULTADO ESPERADO:
-- - Coluna 'type' adicionada
-- - Todas as clínicas existentes = 'PRODUCTION'
-- - Índice criado para performance
-- ============================================

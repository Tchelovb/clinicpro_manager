-- ============================================================
-- ADICIONAR COLUNA UPDATED_AT
-- Execute APENAS este comando primeiro
-- ============================================================

ALTER TABLE public.clinics 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Verificar se foi adicionada
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'clinics' 
AND column_name = 'updated_at';

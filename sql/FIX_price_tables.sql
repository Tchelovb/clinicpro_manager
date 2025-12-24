-- =====================================================
-- FIX: PRICE_TABLES - ADICIONAR COLUNAS E ÍNDICES
-- =====================================================
-- Adiciona apenas o que está faltando
-- =====================================================

-- Adicionar coluna is_standard se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'price_tables' 
        AND column_name = 'is_standard'
    ) THEN
        ALTER TABLE price_tables 
        ADD COLUMN is_standard BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Criar índice se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'price_tables' 
        AND indexname = 'idx_price_tables_standard'
    ) THEN
        CREATE INDEX idx_price_tables_standard 
        ON price_tables(clinic_id, is_standard) 
        WHERE is_standard = TRUE;
    END IF;
END $$;

-- Trigger para garantir apenas uma tabela padrão por clínica
CREATE OR REPLACE FUNCTION ensure_single_standard_price_table()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_standard = TRUE THEN
        -- Desmarcar outras tabelas padrão da mesma clínica
        UPDATE price_tables 
        SET is_standard = FALSE 
        WHERE clinic_id = NEW.clinic_id 
          AND id != NEW.id 
          AND is_standard = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger
DROP TRIGGER IF EXISTS trigger_ensure_single_standard ON price_tables;
CREATE TRIGGER trigger_ensure_single_standard
    BEFORE INSERT OR UPDATE ON price_tables
    FOR EACH ROW
    WHEN (NEW.is_standard = TRUE)
    EXECUTE FUNCTION ensure_single_standard_price_table();

-- =====================================================
-- CRIAR TABELA PADRÃO SE NÃO EXISTIR
-- =====================================================

-- Inserir tabela "Particular" como padrão
INSERT INTO price_tables (clinic_id, name, description, is_standard, active)
SELECT 
    id as clinic_id,
    'Particular' as name,
    'Tabela de preços padrão' as description,
    TRUE as is_standard,
    TRUE as active
FROM clinic
WHERE NOT EXISTS (
    SELECT 1 FROM price_tables 
    WHERE price_tables.clinic_id = clinic.id 
    AND is_standard = TRUE
)
ON CONFLICT (clinic_id, name) DO UPDATE SET
    is_standard = TRUE,
    active = TRUE;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

SELECT 
    pt.id,
    pt.name,
    pt.is_standard,
    pt.active,
    c.name as clinic_name
FROM price_tables pt
JOIN clinic c ON c.id = pt.clinic_id
ORDER BY pt.is_standard DESC, pt.name;

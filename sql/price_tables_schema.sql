-- =====================================================
-- PRICE TABLES - TABELAS DE PREÇOS
-- =====================================================
-- Sistema de múltiplas tabelas de preços
-- (Particular, Convênio, Parceiros, etc)
-- =====================================================

-- Tabela: price_tables
-- Armazena as diferentes tabelas de preço da clínica
CREATE TABLE IF NOT EXISTS price_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinic(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,                   -- Ex: "Particular", "Convênio", "Parceiros"
    description TEXT,                             -- Descrição da tabela
    
    is_standard BOOLEAN DEFAULT FALSE,            -- Se é a tabela padrão
    active BOOLEAN DEFAULT TRUE,                  -- Se está ativa
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(clinic_id, name)
);

-- Tabela: price_table_items
-- Itens (procedimentos) de cada tabela de preço
CREATE TABLE IF NOT EXISTS price_table_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    price_table_id UUID NOT NULL REFERENCES price_tables(id) ON DELETE CASCADE,
    procedure_id UUID NOT NULL REFERENCES procedure(id) ON DELETE CASCADE,
    
    price DECIMAL(10,2) NOT NULL,                 -- Preço específico nesta tabela
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(price_table_id, procedure_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_price_tables_clinic 
    ON price_tables(clinic_id);

CREATE INDEX IF NOT EXISTS idx_price_tables_standard 
    ON price_tables(clinic_id, is_standard) 
    WHERE is_standard = TRUE;

CREATE INDEX IF NOT EXISTS idx_price_table_items_table 
    ON price_table_items(price_table_id);

CREATE INDEX IF NOT EXISTS idx_price_table_items_procedure 
    ON price_table_items(procedure_id);

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

DROP TRIGGER IF EXISTS trigger_ensure_single_standard ON price_tables;
CREATE TRIGGER trigger_ensure_single_standard
    BEFORE INSERT OR UPDATE ON price_tables
    FOR EACH ROW
    WHEN (NEW.is_standard = TRUE)
    EXECUTE FUNCTION ensure_single_standard_price_table();

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_price_tables_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_price_tables ON price_tables;
CREATE TRIGGER trigger_update_price_tables
    BEFORE UPDATE ON price_tables
    FOR EACH ROW
    EXECUTE FUNCTION update_price_tables_timestamp();

DROP TRIGGER IF EXISTS trigger_update_price_table_items ON price_table_items;
CREATE TRIGGER trigger_update_price_table_items
    BEFORE UPDATE ON price_table_items
    FOR EACH ROW
    EXECUTE FUNCTION update_price_tables_timestamp();

-- =====================================================
-- DADOS DE EXEMPLO (OPCIONAL - COMENTADO)
-- =====================================================

/*
-- Criar tabela de preços "Particular" (padrão)
INSERT INTO price_tables (clinic_id, name, description, is_standard, active)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',  -- Substitua pelo ID da sua clínica
    'Particular',
    'Tabela de preços para pacientes particulares',
    TRUE,
    TRUE
)
ON CONFLICT (clinic_id, name) DO UPDATE SET
    is_standard = EXCLUDED.is_standard,
    active = EXCLUDED.active;

-- Criar tabela de preços "Convênio"
INSERT INTO price_tables (clinic_id, name, description, is_standard, active)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Convênio',
    'Tabela de preços para convênios',
    FALSE,
    TRUE
)
ON CONFLICT (clinic_id, name) DO NOTHING;
*/

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE price_tables IS 'Tabelas de preços da clínica (Particular, Convênio, etc)';
COMMENT ON COLUMN price_tables.is_standard IS 'Tabela padrão usada quando nenhuma é especificada';
COMMENT ON TABLE price_table_items IS 'Preços específicos de procedimentos em cada tabela';

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- SELECT * FROM price_tables;
-- SELECT * FROM price_table_items;

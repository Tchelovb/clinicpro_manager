-- ==========================================
-- BLINDAGEM FINAL: CORRIGIR DEFAULTS E NULLS
-- ==========================================

-- 1. Alterar defaults para valores seguros (FALSE)
ALTER TABLE users ALTER COLUMN is_clinical_provider SET DEFAULT false;
ALTER TABLE users ALTER COLUMN is_orcamentista SET DEFAULT false;
ALTER TABLE users ALTER COLUMN is_sales_rep SET DEFAULT false;
ALTER TABLE users ALTER COLUMN is_crc_agent SET DEFAULT false;

-- 2. Garantir que can_schedule seja TRUE por padrão (todos podem agendar)
ALTER TABLE users ALTER COLUMN can_schedule SET DEFAULT true;

-- 3. Adicionar constraint NOT NULL para evitar dados sujos no futuro
UPDATE users SET is_clinical_provider = false WHERE is_clinical_provider IS NULL;
ALTER TABLE users ALTER COLUMN is_clinical_provider SET NOT NULL;

UPDATE users SET is_orcamentista = false WHERE is_orcamentista IS NULL;
ALTER TABLE users ALTER COLUMN is_orcamentista SET NOT NULL;

UPDATE users SET is_sales_rep = false WHERE is_sales_rep IS NULL;
ALTER TABLE users ALTER COLUMN is_sales_rep SET NOT NULL;

UPDATE users SET is_crc_agent = false WHERE is_crc_agent IS NULL;
ALTER TABLE users ALTER COLUMN is_crc_agent SET NOT NULL;

UPDATE users SET can_schedule = true WHERE can_schedule IS NULL;
ALTER TABLE users ALTER COLUMN can_schedule SET NOT NULL;

-- 4. Notificar frontend
NOTIFY pgrst, 'reload schema';

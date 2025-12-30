-- ⚡ SOLUÇÃO EMERGENCIAL: Desabilita RLS para desenvolvimento
-- Isso resolve imediatamente os erros ERR_CONNECTION_RESET
-- ATENÇÃO: Apenas para desenvolvimento - não usar em produção

-- Desabilita RLS nas tabelas problemáticas
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_financial_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE cash_registers DISABLE ROW LEVEL SECURITY;
ALTER TABLE price_tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE procedure DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE professionals DISABLE ROW LEVEL SECURITY;
ALTER TABLE budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE financial_installments DISABLE ROW LEVEL SECURITY;

-- Concede permissões totais para authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON patients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON clinic_financial_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON expenses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON cash_registers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON price_tables TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON procedure TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON professionals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON budgets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON treatment_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_installments TO authenticated;

-- Verifica status do RLS
SELECT 
    tablename, 
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'patients', 
    'clinic_financial_settings', 
    'expenses', 
    'cash_registers',
    'price_tables',
    'procedure',
    'users'
)
ORDER BY tablename;

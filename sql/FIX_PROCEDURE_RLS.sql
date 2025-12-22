-- =====================================================
-- FIX: Row Level Security for procedure_costs
-- =====================================================
-- Corrige políticas de segurança que estão bloqueando
-- a edição de custos de procedimentos

-- 1. Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'procedure_costs';

-- 2. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Users can view procedure costs" ON procedure_costs;
DROP POLICY IF EXISTS "Users can insert procedure costs" ON procedure_costs;
DROP POLICY IF EXISTS "Users can update procedure costs" ON procedure_costs;
DROP POLICY IF EXISTS "Users can delete procedure costs" ON procedure_costs;

-- 3. Criar políticas permissivas para procedure_costs
-- Permitir SELECT (visualizar)
CREATE POLICY "Enable read access for authenticated users"
ON procedure_costs FOR SELECT
TO authenticated
USING (true);

-- Permitir INSERT (criar)
CREATE POLICY "Enable insert for authenticated users"
ON procedure_costs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir UPDATE (atualizar)
CREATE POLICY "Enable update for authenticated users"
ON procedure_costs FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Permitir DELETE (deletar)
CREATE POLICY "Enable delete for authenticated users"
ON procedure_costs FOR DELETE
TO authenticated
USING (true);

-- 4. Fazer o mesmo para a tabela procedure
DROP POLICY IF EXISTS "Users can view procedures" ON procedure;
DROP POLICY IF EXISTS "Users can insert procedures" ON procedure;
DROP POLICY IF EXISTS "Users can update procedures" ON procedure;
DROP POLICY IF EXISTS "Users can delete procedures" ON procedure;

CREATE POLICY "Enable read access for authenticated users"
ON procedure FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON procedure FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
ON procedure FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
ON procedure FOR DELETE
TO authenticated
USING (true);

-- 5. Verificar se as políticas foram criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('procedure', 'procedure_costs')
ORDER BY tablename, policyname;

-- =====================================================
-- RESUMO
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ POLÍTICAS DE SEGURANÇA ATUALIZADAS!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Tabelas atualizadas:';
    RAISE NOTICE '  - procedure';
    RAISE NOTICE '  - procedure_costs';
    RAISE NOTICE '';
    RAISE NOTICE 'Agora você pode:';
    RAISE NOTICE '  ✅ Criar procedimentos';
    RAISE NOTICE '  ✅ Editar procedimentos';
    RAISE NOTICE '  ✅ Deletar procedimentos';
    RAISE NOTICE '  ✅ Gerenciar custos';
    RAISE NOTICE '';
END $$;

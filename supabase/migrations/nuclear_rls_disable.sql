-- ☢️ NUCLEAR OPTION: DISABLE ROW LEVEL SECURITY (DEBUG ONLY)
-- ATENÇÃO: ISSO EXPÕE TODOS OS DADOS DA TABELA USERS PARA LEITURA PÚBLICA (ANON)
-- Use apenas para depurar o problema de "Perfil não carregado".

-- 1. Desabilita RLS na tabela users
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. Concede permissões totais para anon e authenticated (Garante que o problema não é grant)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO anon, authenticated, service_role;

-- 3. Diagnóstico (Pode rodar separadamente para verificar)
-- SELECT * FROM public.users WHERE email = 'admin@clinicpro.com';

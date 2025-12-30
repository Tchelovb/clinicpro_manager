-- 🔓 MASTER KEY PROTOCOL: LIBERAÇÃO TOTAL PARA DESENVOLVIMENTO
-- Executed manually by user. Saved for history.

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Desabilita RLS em TODAS as tabelas do esquema public de uma vez
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;

-- Garante que o usuário autenticado tenha permissão total em tudo
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Notifica o PostgREST para recarregar o esquema imediatamente
NOTIFY pgrst, 'reload schema';

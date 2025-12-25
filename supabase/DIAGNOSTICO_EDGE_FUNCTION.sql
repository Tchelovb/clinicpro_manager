-- ============================================
-- DIAGNÓSTICO: Por que a Edge Function não responde?
-- ============================================

-- 1. Verificar se pg_net está habilitado
SELECT * FROM pg_available_extensions WHERE name = 'pg_net';

-- 2. Verificar se pg_net está instalado
SELECT * FROM pg_extension WHERE extname = 'pg_net';

-- 3. Verificar configuração das URLs
SELECT key, value 
FROM system_settings 
WHERE key IN ('edge_function_url', 'service_role_key');

-- 4. Verificar logs de requisições HTTP (se disponível)
-- Nota: pg_net não armazena logs de erro por padrão

-- 5. Testar requisição HTTP diretamente
SELECT net.http_post(
  url := 'https://huturwlbouvucjnwaoze.supabase.co/functions/v1/agent-orchestrator',
  headers := '{"Authorization": "Bearer ' || (SELECT value FROM system_settings WHERE key = 'service_role_key') || '", "Content-Type": "application/json"}'::jsonb,
  body := '{"agent": "sniper", "event": "test", "data": {"test": true}}'::jsonb
) as request_id;

-- 6. Verificar se a Edge Function está ativa
-- Acesse: https://huturwlbouvucjnwaoze.supabase.co/functions/v1/agent-orchestrator
-- Deve retornar erro 405 (Method Not Allowed) se estiver ativa

-- ============================================
-- POSSÍVEIS PROBLEMAS:
-- ============================================

-- A. pg_net não está habilitado
--    Solução: CREATE EXTENSION pg_net;

-- B. URL da Edge Function incorreta
--    Solução: Verificar se termina com /functions/v1

-- C. Service Role Key incorreta
--    Solução: Copiar novamente do Dashboard

-- D. Edge Function não foi deployada
--    Solução: Verificar no Dashboard se está "Active"

-- E. CORS ou autenticação bloqueando
--    Solução: Verificar logs da Edge Function no Dashboard

-- ============================================
-- EXECUTE ESTE DIAGNÓSTICO E ME MOSTRE OS RESULTADOS
-- ============================================

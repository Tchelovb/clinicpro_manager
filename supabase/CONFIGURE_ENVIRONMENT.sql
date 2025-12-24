-- Script de Configuração do Ambiente Supabase
-- Execute este script no SQL Editor do Supabase

-- ============================================
-- CONFIGURAÇÃO DE VARIÁVEIS DE AMBIENTE
-- ============================================

-- IMPORTANTE: Substitua os valores entre colchetes pelos seus dados reais
-- Encontre em: Settings > API no dashboard do Supabase

-- 1. URL da Edge Function
-- Formato: https://[project-id].supabase.co/functions/v1
-- Exemplo: https://xkyzabcd.supabase.co/functions/v1
ALTER DATABASE postgres SET app.edge_function_url = 'https://[SEU-PROJECT-ID].supabase.co/functions/v1';

-- 2. Service Role Key
-- ATENÇÃO: Use a chave 'service_role' (secret), NÃO a 'anon' (public)
-- Copie de: Settings > API > Project API keys > service_role
ALTER DATABASE postgres SET app.service_role_key = '[SUA-SERVICE-ROLE-KEY-AQUI]';

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar se as configurações foram aplicadas
SELECT 
  name,
  setting,
  CASE 
    WHEN name = 'app.edge_function_url' THEN 
      CASE 
        WHEN setting LIKE 'https://%.supabase.co/functions/v1' THEN '✅ OK'
        ELSE '❌ Formato inválido'
      END
    WHEN name = 'app.service_role_key' THEN
      CASE 
        WHEN length(setting) > 100 THEN '✅ OK'
        ELSE '❌ Key muito curta'
      END
  END as status
FROM pg_settings
WHERE name IN ('app.edge_function_url', 'app.service_role_key');

-- ============================================
-- HABILITAR EXTENSÃO HTTP (se ainda não estiver)
-- ============================================

CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================
-- TESTE DE CONECTIVIDADE
-- ============================================

-- Este comando deve retornar sucesso se tudo estiver configurado
SELECT net.http_get(
  current_setting('app.edge_function_url') || '/agent-orchestrator'
);

-- Se retornar erro 404, está OK! (a função ainda não foi deployada)
-- Se retornar erro de conexão, verifique a URL

-- ============================================
-- FINALIZAÇÃO
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Configuração concluída!';
  RAISE NOTICE '📋 Próximo passo: Deploy da Edge Function';
  RAISE NOTICE '💡 Comando: supabase functions deploy agent-orchestrator';
END $$;

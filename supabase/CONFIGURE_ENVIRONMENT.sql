-- Script de Configuração do Ambiente Supabase
-- Execute este script no SQL Editor do Supabase

-- ============================================
-- CONFIGURAÇÃO DE VARIÁVEIS DE AMBIENTE
-- ============================================

-- IMPORTANTE: Substitua os valores entre colchetes pelos seus dados reais
-- Encontre em: Settings > API no dashboard do Supabase

-- Como o Supabase não permite ALTER DATABASE via SQL Editor,
-- vamos usar a tabela system_settings que já foi criada na Phase 0

-- 1. URL da Edge Function
-- Formato: https://[project-id].supabase.co/functions/v1
-- Exemplo: https://xkyzabcd.supabase.co/functions/v1
INSERT INTO system_settings (key, value, description)
VALUES ('edge_function_url', 'https://[SEU-PROJECT-ID].supabase.co/functions/v1', 'URL base das Edge Functions')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Service Role Key
-- ATENÇÃO: Use a chave 'service_role' (secret), NÃO a 'anon' (public)
-- Copie de: Settings > API > Project API keys > service_role
INSERT INTO system_settings (key, value, description)
VALUES ('service_role_key', '[SUA-SERVICE-ROLE-KEY-AQUI]', 'Chave Service Role para chamadas internas')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar se as configurações foram aplicadas
SELECT 
  key,
  CASE 
    WHEN key = 'edge_function_url' THEN 
      CASE 
        WHEN value LIKE 'https://%.supabase.co/functions/v1' THEN '✅ OK - ' || value
        WHEN value LIKE '%[SEU-PROJECT-ID]%' THEN '❌ Substitua [SEU-PROJECT-ID] pelo ID real'
        ELSE '❌ Formato inválido'
      END
    WHEN key = 'service_role_key' THEN
      CASE 
        WHEN length(value) > 100 THEN '✅ OK - Key configurada (' || length(value) || ' chars)'
        WHEN value LIKE '%[SUA-SERVICE-ROLE-KEY%' THEN '❌ Substitua [SUA-SERVICE-ROLE-KEY-AQUI] pela key real'
        ELSE '❌ Key muito curta ou inválida'
      END
  END as status
FROM system_settings
WHERE key IN ('edge_function_url', 'service_role_key');

-- ============================================
-- HABILITAR EXTENSÃO HTTP (se ainda não estiver)
-- ============================================

CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================
-- ATUALIZAR TRIGGERS PARA USAR system_settings
-- ============================================

-- Os triggers precisam ser atualizados para ler de system_settings
-- ao invés de current_setting()

-- Função auxiliar para buscar configuração
CREATE OR REPLACE FUNCTION get_system_setting(p_key TEXT)
RETURNS TEXT AS $$
DECLARE
  v_value TEXT;
BEGIN
  SELECT value INTO v_value
  FROM system_settings
  WHERE key = p_key;
  
  RETURN v_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_system_setting IS 'Busca valor de configuração da tabela system_settings';

-- ============================================
-- FINALIZAÇÃO
-- ============================================

DO $$
DECLARE
  v_edge_url TEXT;
  v_service_key TEXT;
BEGIN
  SELECT value INTO v_edge_url FROM system_settings WHERE key = 'edge_function_url';
  SELECT value INTO v_service_key FROM system_settings WHERE key = 'service_role_key';
  
  IF v_edge_url LIKE '%[SEU-PROJECT-ID]%' THEN
    RAISE WARNING '⚠️ ATENÇÃO: Substitua [SEU-PROJECT-ID] na edge_function_url';
  END IF;
  
  IF v_service_key LIKE '%[SUA-SERVICE-ROLE-KEY%' THEN
    RAISE WARNING '⚠️ ATENÇÃO: Substitua [SUA-SERVICE-ROLE-KEY-AQUI] na service_role_key';
  END IF;
  
  IF v_edge_url NOT LIKE '%[SEU-PROJECT-ID]%' AND v_service_key NOT LIKE '%[SUA-SERVICE-ROLE-KEY%' THEN
    RAISE NOTICE '✅ Configuração concluída com sucesso!';
    RAISE NOTICE '📋 Próximo passo: Atualizar triggers para usar get_system_setting()';
    RAISE NOTICE '💡 Execute: supabase/migrations/20241224_phase1_update_triggers.sql';
  END IF;
END $$;


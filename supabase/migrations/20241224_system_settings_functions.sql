-- ============================================
-- CONFIGURAÇÕES DO SISTEMA - FUNÇÕES E VIEWS
-- ============================================
-- Este script cria funções seguras para gerenciar
-- as configurações do sistema
-- ============================================

-- Dropar funções existentes (se houver)
DROP FUNCTION IF EXISTS public.update_system_setting(text, text, text);
DROP FUNCTION IF EXISTS public.get_system_setting(text);
DROP VIEW IF EXISTS public.view_system_settings_safe;

-- 1. Função Segura para Atualizar Configurações
-- Permite upsert (insert ou update) em system_settings
CREATE OR REPLACE FUNCTION public.update_system_setting(
    setting_key text,
    setting_value text,
    setting_description text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Upsert: insere se não existe, atualiza se existe
    INSERT INTO public.system_settings (key, value, description)
    VALUES (setting_key, setting_value, setting_description)
    ON CONFLICT (key) 
    DO UPDATE SET 
        value = EXCLUDED.value,
        description = COALESCE(EXCLUDED.description, system_settings.description),
        updated_at = now();
END;
$$;

-- 2. View de Segurança (Mascara Chaves Sensíveis)
-- O frontend deve consultar ESTA view, não a tabela direta
CREATE OR REPLACE VIEW public.view_system_settings_safe AS
SELECT 
    key,
    CASE 
        -- Mascara chaves sensíveis (mostra apenas últimos 4 caracteres)
        WHEN key LIKE '%key%' OR key LIKE '%secret%' OR key LIKE '%token%' 
        THEN '••••••••' || right(value, 4)
        ELSE value 
    END as value,
    description,
    updated_at
FROM public.system_settings;

-- 3. Função para Buscar Configuração Específica
CREATE OR REPLACE FUNCTION public.get_system_setting(setting_key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    setting_value text;
BEGIN
    SELECT value INTO setting_value
    FROM public.system_settings
    WHERE key = setting_key;
    
    RETURN setting_value;
END;
$$;

-- 4. Liberar Acesso para Usuários Autenticados
GRANT SELECT ON public.view_system_settings_safe TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_system_setting TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_system_setting TO authenticated;

-- 5. Verificação
DO $$
BEGIN
    RAISE NOTICE '✅ Funções de configuração criadas com sucesso!';
    RAISE NOTICE '📋 Funções disponíveis:';
    RAISE NOTICE '   - update_system_setting(key, value, description)';
    RAISE NOTICE '   - get_system_setting(key)';
    RAISE NOTICE '📊 Views disponíveis:';
    RAISE NOTICE '   - view_system_settings_safe (chaves mascaradas)';
END $$;


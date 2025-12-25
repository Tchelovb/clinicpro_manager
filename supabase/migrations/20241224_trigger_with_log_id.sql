-- ============================================
-- FIX: Trigger com Log ID para Edge Function
-- ============================================
-- Solução: Passar o log_id para a Edge Function
-- para que ela possa atualizar o registro correto
-- ============================================

-- Dropar trigger antigo
DROP TRIGGER IF EXISTS trigger_gemini_auto ON leads;

-- Criar nova função que passa o log_id
CREATE OR REPLACE FUNCTION call_gemini_with_log_id()
RETURNS TRIGGER AS $$
DECLARE
    v_log_id UUID;
BEGIN
    -- 1. Criar log PENDING primeiro
    INSERT INTO agent_logs (
        entity_id,
        entity_type,
        agent_name,
        event_type,
        action_taken,
        status,
        clinic_id
    ) VALUES (
        NEW.id,
        'LEAD',
        'sniper',
        'lead_created',
        'Gemini AI processando mensagem...',
        'PENDING',
        NEW.clinic_id
    ) RETURNING id INTO v_log_id;
    
    -- 2. Chamar Edge Function passando o log_id
    PERFORM net.http_post(
        url := 'https://huturwlbouvucjnwaoze.supabase.co/functions/v1/gemini-chat',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := jsonb_build_object(
            'name', NEW.name,
            'treatment', NEW.desired_treatment,
            'phone', NEW.phone,
            'log_id', v_log_id,
            'lead_id', NEW.id
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar trigger AFTER INSERT
CREATE TRIGGER trigger_gemini_with_log
    AFTER INSERT ON leads
    FOR EACH ROW
    EXECUTE FUNCTION call_gemini_with_log_id();

-- 4. Comentário
COMMENT ON FUNCTION call_gemini_with_log_id IS 
'Cria log PENDING e chama Edge Function passando log_id para atualização';

-- 5. Verificação
DO $$
BEGIN
    RAISE NOTICE '✅ Trigger atualizado!';
    RAISE NOTICE '🔧 Agora passa log_id para Edge Function';
    RAISE NOTICE '📝 Edge Function pode atualizar o log correto';
END $$;

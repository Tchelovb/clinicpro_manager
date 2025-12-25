-- ============================================
-- FIX: Trigger Automático para Gemini Chat
-- ============================================
-- Esta migration cria um trigger que chama
-- automaticamente a Edge Function gemini-chat
-- quando um novo lead é criado
-- ============================================

-- 1. Dropar triggers antigos que podem estar conflitando
DROP TRIGGER IF EXISTS trigger_gemini_direct ON leads;
DROP TRIGGER IF EXISTS trigger_sniper_agent ON leads;

-- 2. Criar função que chama a Edge Function gemini-chat
CREATE OR REPLACE FUNCTION call_gemini_chat_on_new_lead()
RETURNS TRIGGER AS $$
BEGIN
    -- Chamar Edge Function gemini-chat de forma assíncrona
    PERFORM net.http_post(
        url := 'https://huturwlbouvucjnwaoze.supabase.co/functions/v1/gemini-chat',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1dHVyd2xib3V2dWNqbndh b3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzY1NzYsImV4cCI6MjA1MDU1MjU3Nn0.Ry7uHdHoHvQqQdBPOSPMqGTKhYqNmWZzNlOPJBWKANs'
        ),
        body := jsonb_build_object(
            'name', NEW.name,
            'treatment', NEW.desired_treatment,
            'phone', NEW.phone
        )
    );
    
    -- Log inicial (será atualizado pela Edge Function)
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
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar trigger AFTER INSERT (para não bloquear a inserção)
CREATE TRIGGER trigger_gemini_auto
    AFTER INSERT ON leads
    FOR EACH ROW
    EXECUTE FUNCTION call_gemini_chat_on_new_lead();

-- 4. Comentário
COMMENT ON FUNCTION call_gemini_chat_on_new_lead IS 
'Chama automaticamente a Edge Function gemini-chat quando um novo lead é criado';

-- 5. Verificação
DO $$
BEGIN
    RAISE NOTICE '✅ Trigger automático configurado!';
    RAISE NOTICE '🤖 Novos leads receberão mensagem da IA automaticamente';
    RAISE NOTICE '📋 Edge Function: gemini-chat';
END $$;

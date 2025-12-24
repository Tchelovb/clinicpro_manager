-- ============================================
-- SECURITY PIN MODAL - DATABASE SCHEMA
-- Tarefa 1.2 - Fase 1: Fundação & Blindagem
-- ============================================

-- Adicionar campos de PIN de segurança na tabela users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS transaction_pin_hash TEXT,
ADD COLUMN IF NOT EXISTS pin_locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pin_failed_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pin_last_failed_at TIMESTAMP WITH TIME ZONE;

-- Comentários
COMMENT ON COLUMN public.users.transaction_pin_hash IS 'Hash SHA-256 do PIN de segurança para ações críticas (4-6 dígitos)';
COMMENT ON COLUMN public.users.pin_locked_until IS 'Timestamp até quando o PIN está bloqueado após 3 tentativas falhas';
COMMENT ON COLUMN public.users.pin_failed_attempts IS 'Contador de tentativas falhas consecutivas de PIN';
COMMENT ON COLUMN public.users.pin_last_failed_at IS 'Timestamp da última tentativa falha de PIN';

-- Adicionar novos tipos de ação ao audit log
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'system_audit_logs_action_type_check'
  ) THEN
    ALTER TABLE public.system_audit_logs 
    DROP CONSTRAINT IF EXISTS system_audit_logs_action_type_check;
    
    ALTER TABLE public.system_audit_logs
    ADD CONSTRAINT system_audit_logs_action_type_check 
    CHECK (action_type = ANY (ARRAY[
      'CREATE'::text, 
      'UPDATE'::text, 
      'DELETE'::text, 
      'LOGIN'::text, 
      'LOGOUT'::text, 
      'LOGIN_FAILED'::text, 
      'EXPORT'::text, 
      'IMPORT'::text,
      'PIN_SUCCESS'::text,
      'PIN_FAILED'::text,
      'PIN_BLOCKED'::text,
      'REFUND'::text,
      'DISCOUNT'::text,
      'BUDGET_OVERRIDE'::text
    ]));
  END IF;
END $$;

-- Adicionar novos tipos de entidade ao audit log
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'system_audit_logs_entity_type_check'
  ) THEN
    ALTER TABLE public.system_audit_logs 
    DROP CONSTRAINT IF EXISTS system_audit_logs_entity_type_check;
    
    ALTER TABLE public.system_audit_logs
    ADD CONSTRAINT system_audit_logs_entity_type_check 
    CHECK (entity_type = ANY (ARRAY[
      'PATIENT'::text, 
      'BUDGET'::text, 
      'APPOINTMENT'::text, 
      'EXPENSE'::text, 
      'TRANSACTION'::text, 
      'CASH_REGISTER'::text, 
      'USER'::text, 
      'PROFESSIONAL'::text, 
      'PROCEDURE'::text, 
      'LEAD'::text, 
      'DOCUMENT'::text, 
      'CLINICAL_NOTE'::text, 
      'TREATMENT'::text,
      'SECURITY_PIN'::text,
      'INSTALLMENT'::text
    ]));
  END IF;
END $$;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_pin_locked ON public.users(pin_locked_until) WHERE pin_locked_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_security ON public.system_audit_logs(action_type, created_at DESC) 
WHERE action_type IN ('PIN_SUCCESS', 'PIN_FAILED', 'PIN_BLOCKED', 'REFUND', 'DISCOUNT', 'BUDGET_OVERRIDE');

-- Função para verificar se PIN está bloqueado
CREATE OR REPLACE FUNCTION public.is_pin_locked(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_locked_until TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT pin_locked_until INTO v_locked_until
  FROM public.users
  WHERE id = p_user_id;
  
  IF v_locked_until IS NULL THEN
    RETURN FALSE;
  END IF;
  
  IF v_locked_until > NOW() THEN
    RETURN TRUE;
  ELSE
    -- Desbloqueio automático se o tempo expirou
    UPDATE public.users
    SET pin_locked_until = NULL,
        pin_failed_attempts = 0
    WHERE id = p_user_id;
    
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para registrar tentativa falha de PIN
CREATE OR REPLACE FUNCTION public.register_pin_failure(p_user_id UUID)
RETURNS TABLE(is_locked BOOLEAN, attempts_remaining INTEGER) AS $$
DECLARE
  v_attempts INTEGER;
  v_max_attempts INTEGER := 3;
  v_lockout_minutes INTEGER := 15;
BEGIN
  -- Incrementar contador de falhas
  UPDATE public.users
  SET pin_failed_attempts = COALESCE(pin_failed_attempts, 0) + 1,
      pin_last_failed_at = NOW()
  WHERE id = p_user_id
  RETURNING pin_failed_attempts INTO v_attempts;
  
  -- Se atingiu o limite, bloquear
  IF v_attempts >= v_max_attempts THEN
    UPDATE public.users
    SET pin_locked_until = NOW() + (v_lockout_minutes || ' minutes')::INTERVAL
    WHERE id = p_user_id;
    
    RETURN QUERY SELECT TRUE, 0;
  ELSE
    RETURN QUERY SELECT FALSE, v_max_attempts - v_attempts;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para resetar contador de falhas após sucesso
CREATE OR REPLACE FUNCTION public.reset_pin_failures(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users
  SET pin_failed_attempts = 0,
      pin_last_failed_at = NULL,
      pin_locked_until = NULL
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários nas funções
COMMENT ON FUNCTION public.is_pin_locked(UUID) IS 'Verifica se o PIN do usuário está bloqueado por tentativas falhas';
COMMENT ON FUNCTION public.register_pin_failure(UUID) IS 'Registra tentativa falha de PIN e retorna se foi bloqueado';
COMMENT ON FUNCTION public.reset_pin_failures(UUID) IS 'Reseta contador de falhas após PIN correto';

-- Grant permissions (ajustar conforme RLS)
GRANT EXECUTE ON FUNCTION public.is_pin_locked(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_pin_failure(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_pin_failures(UUID) TO authenticated;

-- Log de instalação
DO $$
BEGIN
  RAISE NOTICE 'Security PIN schema installed successfully!';
  RAISE NOTICE 'Fields added to users table: transaction_pin_hash, pin_locked_until, pin_failed_attempts, pin_last_failed_at';
  RAISE NOTICE 'Functions created: is_pin_locked, register_pin_failure, reset_pin_failures';
END $$;

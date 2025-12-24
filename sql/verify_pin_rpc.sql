-- ============================================
-- SECURITY PIN RPC - SECURE VERIFICATION
-- Tarefa 1.2 - Extension
-- ============================================

-- Function: verify_transaction_pin
-- Description: Verifies if the provided PIN hash matches the stored hash for the current user.
-- Returns: TRUE if match, FALSE otherwise.
-- Security: SECURITY DEFINER to access users table (RLS usually restricts viewing other users, but here we check 'auth.uid()')

CREATE OR REPLACE FUNCTION public.verify_transaction_pin(p_pin_hash text)
RETURNS BOOLEAN AS $$
DECLARE
  v_stored_hash text;
  v_user_id uuid;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check lockout first
  IF public.is_pin_locked(v_user_id) THEN
    RAISE EXCEPTION 'PIN is temporarily locked due to too many failed attempts.';
  END IF;

  -- Get stored hash
  SELECT transaction_pin_hash INTO v_stored_hash
  FROM public.users
  WHERE id = v_user_id;
  
  -- Logic
  IF v_stored_hash IS NULL THEN
    RAISE EXCEPTION 'PIN not set for this user.';
  END IF;
  
  IF v_stored_hash = p_pin_hash THEN
    -- Success: Reset failures
    PERFORM public.reset_pin_failures(v_user_id);
    
    -- Audit Log (Optional here, or call logic from client to log specific action)
    INSERT INTO public.system_audit_logs (
      clinic_id, 
      user_id, 
      user_name, 
      action_type, 
      entity_type, 
      entity_id, 
      entity_name
    )
    SELECT 
      (SELECT clinic_id FROM public.users WHERE id = v_user_id),
      v_user_id,
      (SELECT name FROM public.users WHERE id = v_user_id),
      'PIN_SUCCESS',
      'SECURITY_PIN',
      v_user_id,
      'PIN Verified'
    ;
    
    RETURN TRUE;
  ELSE
    -- Failure: Register failure and check lock
    PERFORM public.register_pin_failure(v_user_id);
    
    -- Audit Log (Failure)
    INSERT INTO public.system_audit_logs (
      clinic_id, 
      user_id, 
      user_name, 
      action_type, 
      entity_type, 
      entity_id, 
      entity_name
    )
    SELECT 
      (SELECT clinic_id FROM public.users WHERE id = v_user_id),
      v_user_id,
      (SELECT name FROM public.users WHERE id = v_user_id),
      'PIN_FAILED',
      'SECURITY_PIN',
      v_user_id,
      'PIN Verification Failed'
    ;
    
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access
GRANT EXECUTE ON FUNCTION public.verify_transaction_pin(text) TO authenticated;

-- Helper Function: set_own_pin (For testing/usage)
CREATE OR REPLACE FUNCTION public.set_own_pin(p_pin_hash text)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users
  SET transaction_pin_hash = p_pin_hash,
      pin_locked_until = NULL,
      pin_failed_attempts = 0
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.set_own_pin(text) TO authenticated;

-- COMMENT
COMMENT ON FUNCTION public.verify_transaction_pin(text) IS 'Verifies transaction PIN for the currently logged in user';

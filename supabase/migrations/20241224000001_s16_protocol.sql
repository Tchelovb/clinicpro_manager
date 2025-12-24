-- Enable pgcrypto for secure hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add S16 Protocol columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS transaction_pin_hash TEXT,
ADD COLUMN IF NOT EXISTS pin_failed_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pin_locked_until TIMESTAMP WITH TIME ZONE;

-- 1. Helper Function: Is PIN Locked?
DROP FUNCTION IF EXISTS is_pin_locked(UUID);

CREATE OR REPLACE FUNCTION is_pin_locked(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_failed_attempts INTEGER;
    v_locked_until TIMESTAMP WITH TIME ZONE;
    v_now TIMESTAMP WITH TIME ZONE := NOW();
    v_is_locked BOOLEAN := FALSE;
BEGIN
    SELECT pin_failed_attempts, pin_locked_until
    INTO v_failed_attempts, v_locked_until
    FROM public.users
    WHERE id = p_user_id;

    -- Check if lock is active
    IF v_locked_until IS NOT NULL AND v_locked_until > v_now THEN
        v_is_locked := TRUE;
    ELSE
        -- Auto-reset if lock expired
        IF v_locked_until IS NOT NULL AND v_locked_until <= v_now THEN
            UPDATE public.users 
            SET pin_failed_attempts = 0, pin_locked_until = NULL 
            WHERE id = p_user_id;
            v_failed_attempts := 0;
        END IF;
    END IF;

    RETURN json_build_object(
        'isLocked', v_is_locked,
        'lockedUntil', v_locked_until,
        'attempts', v_failed_attempts
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Core S16 Verification Function (FORT KNOX)
DROP FUNCTION IF EXISTS verify_transaction_pin(TEXT);

CREATE OR REPLACE FUNCTION verify_transaction_pin(p_pin TEXT)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_stored_hash TEXT;
    v_failed_attempts INTEGER;
    v_locked_until TIMESTAMP WITH TIME ZONE;
    v_now TIMESTAMP WITH TIME ZONE := NOW();
    v_max_attempts INTEGER := 5;
    v_lockout_duration INTERVAL := '15 minutes';
BEGIN
    -- 1. Get user security data
    SELECT transaction_pin_hash, pin_failed_attempts, pin_locked_until
    INTO v_stored_hash, v_failed_attempts, v_locked_until
    FROM public.users
    WHERE id = v_user_id;

    IF v_stored_hash IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'PIN not set');
    END IF;

    -- 2. Check Lockout Status
    IF v_locked_until IS NOT NULL AND v_locked_until > v_now THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'PIN locked', 
            'isLocked', true, 
            'lockedUntil', v_locked_until
        );
    END IF;

    -- 3. Reset lock if expired
    IF v_locked_until IS NOT NULL AND v_locked_until <= v_now THEN
        v_failed_attempts := 0;
        UPDATE public.users SET pin_failed_attempts = 0, pin_locked_until = NULL WHERE id = v_user_id;
    END IF;

    -- 4. Verify PIN
    IF v_stored_hash = crypt(p_pin, v_stored_hash) THEN
        -- SUCCESS: Reset counters
        UPDATE public.users 
        SET pin_failed_attempts = 0, pin_locked_until = NULL 
        WHERE id = v_user_id;
        
        RETURN json_build_object('success', true, 'message', 'Authorized');
    ELSE
        -- FAILURE: Increment attempts
        v_failed_attempts := v_failed_attempts + 1;
        
        IF v_failed_attempts >= v_max_attempts THEN
            -- Trigger Lockout
            UPDATE public.users 
            SET pin_failed_attempts = v_failed_attempts, 
                pin_locked_until = v_now + v_lockout_duration 
            WHERE id = v_user_id;
            
            RETURN json_build_object(
                'success', false, 
                'message', 'PIN locked due to too many failed attempts',
                'isLocked', true,
                'lockedUntil', v_now + v_lockout_duration
            );
        ELSE
            -- Warning
            UPDATE public.users SET pin_failed_attempts = v_failed_attempts WHERE id = v_user_id;
            
            RETURN json_build_object(
                'success', false, 
                'message', 'Incorrect PIN',
                'attemptsRemaining', v_max_attempts - v_failed_attempts
            );
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Setup/Reset PIN (Authenticated User Only)
DROP FUNCTION IF EXISTS set_own_pin(TEXT);

CREATE OR REPLACE FUNCTION set_own_pin(p_pin TEXT)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    -- Verifica se o usuário está autenticado
    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Usuário não autenticado');
    END IF;

    -- Atualiza o hash do PIN usando crypt com salt (Blowfish)
    -- Correção: Usando public.users, não profiles, para consistência com o restante do sistema
    UPDATE public.users 
    SET transaction_pin_hash = crypt(p_pin, gen_salt('bf')),
        pin_failed_attempts = 0,
        pin_locked_until = NULL
    WHERE id = v_user_id;

    RETURN json_build_object('success', true, 'message', 'PIN de segurança configurado com sucesso');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- REPAIR AUTH <-> PUBLIC SYNC
-- Este script corrige o "Descompasso de IDs" que impede o salvamento.

DO $$
DECLARE
  v_auth_id uuid;
  v_email text := 'admin@clinicpro.com'; -- 🎯 SEU EMAIL AQUI
BEGIN
  -- 1. Buscar o ID real do sistema de login (Auth)
  SELECT id INTO v_auth_id FROM auth.users WHERE email = v_email LIMIT 1;

  -- Se achou o usuário no Auth...
  IF v_auth_id IS NOT NULL THEN
    RAISE NOTICE '🔍 Usuário Auth encontrado: %', v_auth_id;

    -- 2. REMOVER O "IMPOSTOR" DA PUBLIC
    -- Apaga qualquer registro na tabela pública que tenha esse email mas ID DIFERENIE
    -- Isso remove o registro "velho" ou "duplicado" que está bloqueando o novo.
    DELETE FROM public.users 
    WHERE email = v_email AND id != v_auth_id;
    
    RAISE NOTICE '🗑️ Registros conflitantes removidos.';

    -- 3. INSERIR/ATUALIZAR O CORRETO
    -- Agora insere ou atualiza o registro com o ID CERTO (vinculado ao Auth)
    INSERT INTO public.users (id, email, name, role, clinic_id)
    VALUES (
        v_auth_id, 
        v_email, 
        'Dr. Marcelo', 
        'MASTER', 
        '550e8400-e29b-41d4-a716-446655440000' -- ID da Clínica Padrão
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email, 
        name = 'Dr. Marcelo',
        role = 'MASTER',
        updated_at = now();
        
    RAISE NOTICE '✅ Sincronização concluída com sucesso!';
  ELSE
    RAISE NOTICE '❌ ERRO: Usuário não encontrado no sistema de Login (Auth). Verifique se o email está correto.';
  END IF;
END $$;

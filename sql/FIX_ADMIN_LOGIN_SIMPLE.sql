-- ============================================
-- FIX ADMIN LOGIN - VERSÃO SIMPLIFICADA
-- ============================================
-- Este script cria/atualiza o usuário admin@clinicpro.com
-- IMPORTANTE: Crie o usuário no Supabase Auth Dashboard PRIMEIRO!
-- ============================================

-- 1. Criar clínica padrão (se não existir)
INSERT INTO public.clinics (id, name, code)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'ClinicPro',
    'CLINICPRO'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Criar/atualizar usuário admin no public.users
DO $$
DECLARE
    auth_user_id uuid;
BEGIN
    -- Buscar ID do usuário no auth
    SELECT id INTO auth_user_id
    FROM auth.users
    WHERE email = 'admin@clinicpro.com';
    
    -- Se encontrou, criar/atualizar no public.users
    IF auth_user_id IS NOT NULL THEN
        INSERT INTO public.users (
            id,
            clinic_id,
            email,
            name,
            role,
            active,
            is_clinical_provider
        )
        VALUES (
            auth_user_id,
            '550e8400-e29b-41d4-a716-446655440000',
            'admin@clinicpro.com',
            'Administrador',
            'MASTER',
            true,
            false
        )
        ON CONFLICT (id) DO UPDATE SET
            clinic_id = '550e8400-e29b-41d4-a716-446655440000',
            role = 'MASTER',
            active = true;
        
        RAISE NOTICE '✅ Usuário admin criado/atualizado com sucesso!';
    ELSE
        RAISE NOTICE '❌ Usuário não encontrado no auth.users';
        RAISE NOTICE 'Crie o usuário no Supabase Dashboard primeiro:';
        RAISE NOTICE '1. Authentication > Users > Add User';
        RAISE NOTICE '2. Email: admin@clinicpro.com';
        RAISE NOTICE '3. Password: admin123';
        RAISE NOTICE '4. Auto Confirm: SIM';
    END IF;
END $$;

-- 3. Verificar se tudo está correto
SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.clinic_id,
    c.name as clinic_name,
    c.code as clinic_code,
    u.active,
    CASE 
        WHEN u.clinic_id IS NOT NULL THEN '✅ OK - Pode fazer login'
        ELSE '❌ SEM CLÍNICA - Não pode fazer login'
    END as status
FROM public.users u
LEFT JOIN public.clinics c ON u.clinic_id = c.id
WHERE u.email = 'admin@clinicpro.com';

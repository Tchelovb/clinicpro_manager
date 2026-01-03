-- ============================================
-- DIAGNÓSTICO DE LOGIN - admin@clinicpro.com
-- ============================================

-- 1. Verificar se usuário existe no auth.users
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data
FROM auth.users
WHERE email = 'admin@clinicpro.com';

-- 2. Verificar se usuário existe no public.users
SELECT 
    id,
    email,
    name,
    role,
    clinic_id,
    active,
    is_clinical_provider
FROM public.users
WHERE email = 'admin@clinicpro.com';

-- 3. Verificar clínica padrão
SELECT 
    id,
    name,
    code
FROM public.clinics
WHERE id = '550e8400-e29b-41d4-a716-446655440000';

-- ============================================
-- CORREÇÃO: Criar usuário admin se não existir
-- ============================================

-- 4. Se não existir, criar clínica padrão
INSERT INTO public.clinics (id, name, code)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'ClinicPro',
    'CLINICPRO'
)
ON CONFLICT (id) DO NOTHING;

-- 5. Criar usuário admin no public.users (se não existir)
-- IMPORTANTE: Primeiro você precisa criar no Supabase Auth Dashboard
-- Depois execute este script para criar no public.users

-- Buscar ID do auth.users
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
            roles,
            active,
            is_clinical_provider,
            professional_id
        )
        VALUES (
            auth_user_id,
            '550e8400-e29b-41d4-a716-446655440000',
            'admin@clinicpro.com',
            'Administrador',
            'MASTER',
            ARRAY['MASTER', 'ADMIN'],
            true,
            false,
            NULL
        )
        ON CONFLICT (id) DO UPDATE SET
            clinic_id = '550e8400-e29b-41d4-a716-446655440000',
            role = 'MASTER',
            roles = ARRAY['MASTER', 'ADMIN'],
            active = true;
        
        RAISE NOTICE '✅ Usuário admin criado/atualizado com sucesso!';
    ELSE
        RAISE NOTICE '⚠️ Usuário não encontrado no auth.users. Crie primeiro no Supabase Dashboard.';
    END IF;
END $$;

-- ============================================
-- VALIDAÇÃO FINAL
-- ============================================

-- 6. Verificar se tudo está correto
SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.clinic_id,
    c.name as clinic_name,
    c.code as clinic_code,
    u.active as user_active,
    CASE 
        WHEN u.clinic_id IS NOT NULL THEN '✅ OK'
        ELSE '❌ SEM CLÍNICA'
    END as status
FROM public.users u
LEFT JOIN public.clinics c ON u.clinic_id = c.id
WHERE u.email = 'admin@clinicpro.com';

-- Deve retornar:
-- ✅ OK com clinic_id preenchido

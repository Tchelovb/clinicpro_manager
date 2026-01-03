-- ============================================
-- FIX LOGIN ADMIN - SOLUÇÃO DEFINITIVA
-- ============================================
-- Este script resolve o problema de login do admin@clinicpro.com
-- ============================================

-- PASSO 1: Criar clínica padrão (se não existir)
INSERT INTO public.clinics (id, name, code)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'ClinicPro',
    'CLINICPRO'
)
ON CONFLICT (id) DO NOTHING;

-- PASSO 2: Verificar se usuário existe no auth.users
DO $$
DECLARE
    auth_user_id uuid;
    user_exists boolean;
BEGIN
    -- Buscar ID do usuário no auth
    SELECT id INTO auth_user_id
    FROM auth.users
    WHERE email = 'admin@clinicpro.com';
    
    IF auth_user_id IS NULL THEN
        RAISE NOTICE '❌ ERRO: Usuário admin@clinicpro.com não existe no auth.users';
        RAISE NOTICE '';
        RAISE NOTICE 'SOLUÇÃO:';
        RAISE NOTICE '1. Abra Supabase Dashboard';
        RAISE NOTICE '2. Vá em Authentication > Users';
        RAISE NOTICE '3. Clique em "Add User"';
        RAISE NOTICE '4. Email: admin@clinicpro.com';
        RAISE NOTICE '5. Password: admin123';
        RAISE NOTICE '6. Auto Confirm User: ✅ MARQUE';
        RAISE NOTICE '7. Execute este script novamente';
        RAISE NOTICE '';
    ELSE
        -- Verificar se já existe no public.users
        SELECT EXISTS(
            SELECT 1 FROM public.users WHERE id = auth_user_id
        ) INTO user_exists;
        
        IF user_exists THEN
            -- Atualizar usuário existente
            UPDATE public.users SET
                clinic_id = '550e8400-e29b-41d4-a716-446655440000',
                role = 'MASTER',
                active = true,
                is_clinical_provider = false,
                is_sales_rep = false,
                is_orcamentista = false,
                professional_id = NULL,  -- Admin não é profissional
                updated_at = now()
            WHERE id = auth_user_id;
            
            RAISE NOTICE '✅ Usuário admin ATUALIZADO com sucesso!';
        ELSE
            -- Criar novo usuário
            INSERT INTO public.users (
                id,
                clinic_id,
                email,
                name,
                role,
                active,
                is_clinical_provider,
                is_sales_rep,
                is_orcamentista,
                professional_id
            )
            VALUES (
                auth_user_id,
                '550e8400-e29b-41d4-a716-446655440000',
                'admin@clinicpro.com',
                'Administrador',
                'MASTER',
                true,
                false,  -- Admin não é profissional clínico
                false,
                false,
                NULL    -- Admin não tem professional_id
            );
            
            RAISE NOTICE '✅ Usuário admin CRIADO com sucesso!';
        END IF;
        
        RAISE NOTICE '';
        RAISE NOTICE '📊 DADOS DO USUÁRIO:';
        RAISE NOTICE '  - ID: %', auth_user_id;
        RAISE NOTICE '  - Email: admin@clinicpro.com';
        RAISE NOTICE '  - Clínica: ClinicPro';
        RAISE NOTICE '  - Role: MASTER';
        RAISE NOTICE '';
        RAISE NOTICE '✅ Agora você pode fazer login!';
    END IF;
END $$;

-- PASSO 3: Validar configuração final
SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.clinic_id,
    c.name as clinic_name,
    c.code as clinic_code,
    u.active,
    u.is_clinical_provider,
    u.professional_id,
    CASE 
        WHEN u.clinic_id IS NOT NULL AND u.active = true THEN '✅ OK - Pode fazer login'
        WHEN u.clinic_id IS NULL THEN '❌ SEM CLÍNICA'
        WHEN u.active = false THEN '❌ USUÁRIO INATIVO'
        ELSE '⚠️ VERIFICAR'
    END as status
FROM public.users u
LEFT JOIN public.clinics c ON u.clinic_id = c.id
WHERE u.email = 'admin@clinicpro.com';

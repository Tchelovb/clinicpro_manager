-- FORCE IDENTITY UPDATE FOR MASTER USER

-- 1. Identificar o usuário admin (pelo email)
-- Substitua 'admin@clinicpro.com' pelo email real se for diferente (e.g. marcelo@clinicpro.com)
-- Como precaução, atualizamos ambos os padrões comuns de dev.

-- UPDATE para 'admin@clinicpro.com'
UPDATE auth.users
SET raw_user_meta_data = 
  jsonb_set(
    jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{full_name}', '"Dr. Marcelo"'
    ),
    '{name}', '"Dr. Marcelo"'
  )
WHERE email ILIKE '%admin%' OR email ILIKE '%marcelo%';

-- UPDATE na tabela pública (Reflete na UI)
UPDATE public.users
SET name = 'Dr. Marcelo',
    avatar_url = NULL -- Força o uso das iniciais se não tiver foto, ou mantenha se tiver
WHERE email ILIKE '%admin%' OR email ILIKE '%marcelo%';

-- Garantir que ele seja MASTER
UPDATE public.users
SET role = 'MASTER'
WHERE email ILIKE '%admin%' OR email ILIKE '%marcelo%';

-- Confirmação
SELECT id, email, name, role FROM public.users WHERE email ILIKE '%admin%' OR email ILIKE '%marcelo%';

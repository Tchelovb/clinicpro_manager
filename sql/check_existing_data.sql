-- ============================================================
-- MASTER SETUP - Usando Dados Existentes
-- ============================================================

-- Passo 1: Verificar usuários existentes
SELECT 
    id,
    email,
    name,
    role,
    clinic_id,
    active
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- Passo 2: Verificar clínicas existentes
SELECT 
    id,
    name,
    code,
    status
FROM public.clinics
ORDER BY created_at DESC;

-- ============================================================
-- IMPORTANTE: Anote o ID de um usuário admin existente
-- Você vai promover esse usuário para MASTER
-- ============================================================

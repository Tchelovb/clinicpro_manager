-- 1. ADICIONAR CAMPOS CLÍNICOS NA TABELA DE USUÁRIOS
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS cro text,
ADD COLUMN IF NOT EXISTS specialty text,
ADD COLUMN IF NOT EXISTS council text DEFAULT 'CRO',
ADD COLUMN IF NOT EXISTS agenda_color text DEFAULT '#3B82F6',
ADD COLUMN IF NOT EXISTS commission_percent numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_release_rule text DEFAULT 'FULL_ON_COMPLETION';

-- 2. MIGRAR DADOS (Copiar da tabela antiga para a nova)
-- Isso salva os dados dos dentistas que o senhor já cadastrou
UPDATE public.users u
SET 
    cro = p.crc,
    specialty = p.specialty,
    council = p.council,
    agenda_color = p.color,
    commission_percent = pc.commission_percent -- Tenta pegar da tabela de comissões se existir
FROM public.professionals p
LEFT JOIN public.professional_commissions pc ON pc.professional_id = p.id
WHERE u.id = p.id;

-- 3. AJUSTAR O ADMIN (Correção do seu erro específico)
-- Se o Admin for dentista, garanta que ele tenha acesso, senão, limpa os campos.
UPDATE public.users
SET role = 'ADMIN' -- Garante que ele é admin
WHERE email LIKE 'admin@%'; -- Ou use o ID específico se souber

-- 4. CONFIRMAÇÃO
SELECT id, name, email, role, cro, specialty FROM public.users;

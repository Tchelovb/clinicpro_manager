-- 1. Adiciona a coluna de gênero (M para Masculino, F para Feminino)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS gender text CHECK (gender = ANY (ARRAY['M'::text, 'F'::text]));

-- 2. Documentação da coluna
COMMENT ON COLUMN public.users.gender IS 'Gênero do usuário para fins de tratamento automático (Dr./Dra.)';

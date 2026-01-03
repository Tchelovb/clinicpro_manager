-- 1. Garante colunas para Orçamentistas e Vendedores na tabela users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_orcamentista boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS attendance_pin_hash text, -- PIN exclusivo para evolução clínica
ADD COLUMN IF NOT EXISTS specialty text,
ADD COLUMN IF NOT EXISTS cro text;

-- 2. Atualiza o tratamento de Gênero para ser obrigatório na visualização, padronizando para 'M' se nulo
ALTER TABLE public.users ALTER COLUMN gender SET DEFAULT 'M';

-- 3. Notifica o PostgREST para recarregar o schema cache
NOTIFY pgrst, 'reload schema';

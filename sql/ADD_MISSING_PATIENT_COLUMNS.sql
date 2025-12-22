-- Adiciona colunas faltantes na tabela patients para suportar o formulário completo

-- 1. Endereço Estruturado
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS zip_code text,
ADD COLUMN IF NOT EXISTS street text,
ADD COLUMN IF NOT EXISTS number text,
ADD COLUMN IF NOT EXISTS complement text,
ADD COLUMN IF NOT EXISTS neighborhood text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text;

-- 2. Preferência de Contato
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS contact_preference text DEFAULT 'WHATSAPP';

-- 3. Origem (Marketing) - Texto simples para compatibilidade com o form atual
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS origin text DEFAULT 'Instagram';

-- Atualiza comentários (opcional)
COMMENT ON COLUMN public.patients.zip_code IS 'CEP';
COMMENT ON COLUMN public.patients.origin IS 'Origem do paciente (ex: Instagram, Google Ads) - Texto simples';

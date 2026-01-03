-- Simplificando PINs para PIN Único
-- Removemos a coluna redundante para evitar confusão e erros de salvamento do frontend
ALTER TABLE public.users DROP COLUMN IF EXISTS attendance_pin_hash;

-- Garantir que transaction_pin_hash é usado para tudo
COMMENT ON COLUMN public.users.transaction_pin_hash IS 'PIN único de 4 dígitos para autorização de descontos e assinatura clínica';

NOTIFY pgrst, 'reload schema';

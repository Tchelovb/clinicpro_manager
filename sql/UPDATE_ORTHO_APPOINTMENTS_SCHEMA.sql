-- Add missing columns for Aligner tracking in Appointments
ALTER TABLE public.ortho_appointments 
ADD COLUMN IF NOT EXISTS current_aligner_upper integer,
ADD COLUMN IF NOT EXISTS current_aligner_lower integer;

-- Update the comments/documentation if necessary
COMMENT ON COLUMN public.ortho_appointments.current_aligner_upper IS 'Número do alinhador superior em uso nesta consulta';
COMMENT ON COLUMN public.ortho_appointments.current_aligner_lower IS 'Número do alinhador inferior em uso nesta consulta';

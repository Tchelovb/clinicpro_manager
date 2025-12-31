-- ============================================
-- MIGRATION: Fix Enums for Appointments
-- Date: 2025-12-30
-- Objective: Ensure appointment_type and appointment_status have all required values
-- ============================================

-- 1. Add missing values to appointment_type (IF NOT EXISTS)
-- Postgres 12+ supports IF NOT EXISTS for ADD VALUE
ALTER TYPE public.appointment_type ADD VALUE IF NOT EXISTS 'TREATMENT';
ALTER TYPE public.appointment_type ADD VALUE IF NOT EXISTS 'RETURN';
ALTER TYPE public.appointment_type ADD VALUE IF NOT EXISTS 'URGENCY';

-- Legacy/Portuguese support (optional, just to be safe if used strictly)
ALTER TYPE public.appointment_type ADD VALUE IF NOT EXISTS 'Avaliação';
ALTER TYPE public.appointment_type ADD VALUE IF NOT EXISTS 'Procedimento';
ALTER TYPE public.appointment_type ADD VALUE IF NOT EXISTS 'Retorno';
ALTER TYPE public.appointment_type ADD VALUE IF NOT EXISTS 'Urgência';

-- 2. Add missing values to appointment_status (Safeguard)
ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'CONFIRMED';
ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'ARRIVED';
ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'IN_PROGRESS';
ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'COMPLETED';
ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'CANCELLED';
ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'NO_SHOW';

-- Portuguese Status Support
ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'Pendente';
ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'Confirmado';
ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'Concluído';
ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'Cancelado';
ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'Faltou';

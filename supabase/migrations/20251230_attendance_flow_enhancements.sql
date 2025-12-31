-- Migration: Attendance Flow Enhancements
-- Description: Adds fields for PIN signature tracking and financial auditing in the queue.

-- 1. Updates to 'attendance_queue' for Financial Shielding
ALTER TABLE public.attendance_queue 
ADD COLUMN IF NOT EXISTS transaction_id uuid REFERENCES public.transactions(id),
ADD COLUMN IF NOT EXISTS billing_verified boolean DEFAULT false;

-- 2. Updates to 'treatment_items' for Digital Signature/Traceability
ALTER TABLE public.treatment_items 
ADD COLUMN IF NOT EXISTS signed_by_user_id uuid REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS signature_timestamp timestamp with time zone;

-- 3. Updates to 'attendance_queue' for better tracking (if not exists)
ALTER TABLE public.attendance_queue
ADD COLUMN IF NOT EXISTS risk_level text CHECK (risk_level IN ('A', 'B', 'C', 'D'));

-- 4. Index for performance
CREATE INDEX IF NOT EXISTS idx_attendance_queue_status ON public.attendance_queue(status);
CREATE INDEX IF NOT EXISTS idx_attendance_queue_clinic_id ON public.attendance_queue(clinic_id);

-- 5. RPC to safely sign a treatment item (optional, but good for atomicity)
CREATE OR REPLACE FUNCTION public.sign_treatment_item(
  p_item_id uuid,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.treatment_items
  SET 
    signed_by_user_id = p_user_id,
    signature_timestamp = now(),
    status = 'COMPLETED'
  WHERE id = p_item_id;
END;
$$;

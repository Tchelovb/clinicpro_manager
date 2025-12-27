-- Add PIN hash columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'transaction_pin_hash') THEN
        ALTER TABLE public.users ADD COLUMN transaction_pin_hash TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'attendance_pin_hash') THEN
        ALTER TABLE public.users ADD COLUMN attendance_pin_hash TEXT;
    END IF;
END $$;

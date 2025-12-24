-- =====================================================
-- ADD PAYMENT RELEASE RULE TO PROFESSIONALS
-- Enables proportional payment based on patient payment progress
-- =====================================================

-- Add payment_release_rule column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'professionals' 
        AND column_name = 'payment_release_rule'
    ) THEN
        ALTER TABLE professionals
        ADD COLUMN payment_release_rule VARCHAR(30) DEFAULT 'FULL_ON_COMPLETION'
            CHECK (payment_release_rule IN ('FULL_ON_COMPLETION', 'PROPORTIONAL_TO_PAYMENT'));
        
        RAISE NOTICE 'payment_release_rule column added to professionals table';
    ELSE
        RAISE NOTICE 'payment_release_rule column already exists';
    END IF;
END $$;

-- Add comment
COMMENT ON COLUMN professionals.payment_release_rule IS 
    'FULL_ON_COMPLETION: Release 100% of fee when procedure is completed (default). 
     PROPORTIONAL_TO_PAYMENT: Release fee proportional to patient payment progress.';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Payment release rule configuration completed successfully';
END $$;

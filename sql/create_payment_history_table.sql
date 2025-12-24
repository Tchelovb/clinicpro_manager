-- =====================================================
-- PROFESSIONAL PAYMENT HISTORY TABLE
-- Stores permanent records of settled payment periods
-- =====================================================

-- Create the table
CREATE TABLE IF NOT EXISTS professional_payment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    
    -- Period Information
    period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
    period_year INTEGER NOT NULL CHECK (period_year >= 2020),
    settlement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Financial Summary
    total_gross DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_deductions DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_net_payable DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_clinic_profit DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Detailed Breakdown (JSON)
    items_detail JSONB NOT NULL,
    clinic_config JSONB NOT NULL,
    
    -- Metadata
    settled_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_professional_period UNIQUE(professional_id, period_month, period_year)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_history_professional 
    ON professional_payment_history(professional_id);

CREATE INDEX IF NOT EXISTS idx_payment_history_period 
    ON professional_payment_history(period_year DESC, period_month DESC);

CREATE INDEX IF NOT EXISTS idx_payment_history_clinic 
    ON professional_payment_history(clinic_id);

CREATE INDEX IF NOT EXISTS idx_payment_history_settlement_date 
    ON professional_payment_history(settlement_date DESC);

-- Enable Row Level Security
ALTER TABLE professional_payment_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view payment history for their clinic" ON professional_payment_history;
DROP POLICY IF EXISTS "Users can insert payment history for their clinic" ON professional_payment_history;
DROP POLICY IF EXISTS "Users can update payment history for their clinic" ON professional_payment_history;

-- RLS Policy: SELECT - Users can view payment history for their clinic
CREATE POLICY "Users can view payment history for their clinic"
    ON professional_payment_history FOR SELECT
    USING (
        clinic_id IN (
            SELECT clinic_id FROM users WHERE id = auth.uid()
        )
    );

-- RLS Policy: INSERT - Users can insert payment history for their clinic
CREATE POLICY "Users can insert payment history for their clinic"
    ON professional_payment_history FOR INSERT
    WITH CHECK (
        clinic_id IN (
            SELECT clinic_id FROM users WHERE id = auth.uid()
        )
    );

-- RLS Policy: UPDATE - Users can update notes for their clinic's records
CREATE POLICY "Users can update payment history for their clinic"
    ON professional_payment_history FOR UPDATE
    USING (
        clinic_id IN (
            SELECT clinic_id FROM users WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        clinic_id IN (
            SELECT clinic_id FROM users WHERE id = auth.uid()
        )
    );

-- Add comment to table
COMMENT ON TABLE professional_payment_history IS 'Stores permanent records of professional payment settlements for legal and financial tracking';

-- Add comments to important columns
COMMENT ON COLUMN professional_payment_history.items_detail IS 'JSON array containing detailed breakdown of all treatment items in the settlement';
COMMENT ON COLUMN professional_payment_history.clinic_config IS 'JSON snapshot of clinic financial configuration at time of settlement';
COMMENT ON COLUMN professional_payment_history.settlement_date IS 'Timestamp when the period was officially settled';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'professional_payment_history table created successfully with RLS policies';
END $$;

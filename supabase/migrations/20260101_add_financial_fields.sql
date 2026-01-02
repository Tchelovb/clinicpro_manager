-- Migration: Add financial negotiation fields to budgets table
-- Created: 2026-01-01
-- Description: Adds down_payment_value and first_due_date columns to support
--              advanced payment negotiation in NegotiationSheet component

-- Add down payment value column
ALTER TABLE budgets 
ADD COLUMN IF NOT EXISTS down_payment_value NUMERIC DEFAULT 0 
CHECK (down_payment_value >= 0);

-- Add first due date column
ALTER TABLE budgets 
ADD COLUMN IF NOT EXISTS first_due_date DATE;

-- Add comment for documentation
COMMENT ON COLUMN budgets.down_payment_value IS 'Valor da entrada/sinal acordado na negociação';
COMMENT ON COLUMN budgets.first_due_date IS 'Data do primeiro vencimento das parcelas';

-- Create index for queries filtering by due date
CREATE INDEX IF NOT EXISTS idx_budgets_first_due_date 
ON budgets(first_due_date) 
WHERE first_due_date IS NOT NULL;

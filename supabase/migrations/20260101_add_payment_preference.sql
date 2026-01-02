-- Migration: Add Payment Preference Fields to Budgets
-- Description: Adds fields to store doctor's payment method suggestion from Budget Studio
-- Author: ClinicPro Team
-- Date: 2026-01-01

-- Add payment preference columns to budgets table
ALTER TABLE budgets 
ADD COLUMN IF NOT EXISTS payment_method_preference VARCHAR(50),
ADD COLUMN IF NOT EXISTS suggested_installments INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS suggested_discount_percent DECIMAL(5,2) DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN budgets.payment_method_preference IS 'Sugestão de forma de pagamento do consultório: PIX, CREDIT_CARD, DEBIT_CARD, CASH, BOLETO';
COMMENT ON COLUMN budgets.suggested_installments IS 'Número de parcelas sugerido pelo consultório (1-12)';
COMMENT ON COLUMN budgets.suggested_discount_percent IS 'Desconto percentual sugerido (ex: 5% para PIX)';

-- Create index for faster queries on payment method preference
CREATE INDEX IF NOT EXISTS idx_budgets_payment_preference 
ON budgets(payment_method_preference) 
WHERE payment_method_preference IS NOT NULL;

-- Add check constraint to ensure valid payment methods
ALTER TABLE budgets 
ADD CONSTRAINT chk_payment_method_preference 
CHECK (
  payment_method_preference IS NULL OR 
  payment_method_preference IN ('PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH', 'BOLETO')
);

-- Add check constraint for installments range (1-18 to match card machine)
ALTER TABLE budgets 
ADD CONSTRAINT chk_suggested_installments 
CHECK (suggested_installments >= 1 AND suggested_installments <= 18);

-- Add check constraint for discount percentage
ALTER TABLE budgets 
ADD CONSTRAINT chk_suggested_discount_percent 
CHECK (suggested_discount_percent >= 0 AND suggested_discount_percent <= 100);

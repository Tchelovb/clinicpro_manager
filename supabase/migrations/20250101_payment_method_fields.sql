-- =========================================
-- PAYMENT METHOD INTEGRATION
-- =========================================
-- Adds payment method selection fields to budgets table
-- This allows doctors to configure payment terms in the consultation room
-- The data is then used to pre-fill the checkout page at reception

-- Add payment method fields to budgets
ALTER TABLE public.budgets 
ADD COLUMN IF NOT EXISTS chosen_payment_method TEXT,
ADD COLUMN IF NOT EXISTS chosen_installments INTEGER DEFAULT 1;

-- Add helpful comments
COMMENT ON COLUMN public.budgets.chosen_payment_method IS 'Payment method selected during budget creation (PIX, CREDIT_CARD, CASH, BOLETO)';
COMMENT ON COLUMN public.budgets.chosen_installments IS 'Number of installments selected for credit card payments';


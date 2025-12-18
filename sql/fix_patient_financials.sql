-- Script para corrigir saldo financeiro do paciente Maria de Fatima Bertolino
-- após exclusão incorreta de orçamento

-- 1. Verificar estado atual
SELECT 
  id,
  name,
  total_approved,
  total_paid,
  balance_due
FROM patients 
WHERE name LIKE '%Maria de Fatima%';

-- 2. Recalcular totais baseado nas parcelas existentes
WITH patient_financials AS (
  SELECT 
    patient_id,
    SUM(amount) as total_amount,
    SUM(amount_paid) as total_paid_amount
  FROM financial_installments
  WHERE patient_id IN (
    SELECT id FROM patients WHERE name LIKE '%Maria de Fatima%'
  )
  GROUP BY patient_id
)
SELECT 
  p.id,
  p.name,
  p.total_approved as current_approved,
  COALESCE(pf.total_amount, 0) as calculated_approved,
  p.total_paid as current_paid,
  COALESCE(pf.total_paid_amount, 0) as calculated_paid,
  p.balance_due as current_balance,
  COALESCE(pf.total_amount, 0) - COALESCE(pf.total_paid_amount, 0) as calculated_balance
FROM patients p
LEFT JOIN patient_financials pf ON p.id = pf.patient_id
WHERE p.name LIKE '%Maria de Fatima%';

-- 3. Atualizar com valores corretos
UPDATE patients
SET 
  total_approved = COALESCE((
    SELECT SUM(amount) 
    FROM financial_installments 
    WHERE patient_id = patients.id
  ), 0),
  total_paid = COALESCE((
    SELECT SUM(amount_paid) 
    FROM financial_installments 
    WHERE patient_id = patients.id
  ), 0),
  balance_due = COALESCE((
    SELECT SUM(amount) - SUM(amount_paid)
    FROM financial_installments 
    WHERE patient_id = patients.id
  ), 0)
WHERE name LIKE '%Maria de Fatima%';

-- 4. Verificar resultado
SELECT 
  id,
  name,
  total_approved,
  total_paid,
  balance_due
FROM patients 
WHERE name LIKE '%Maria de Fatima%';

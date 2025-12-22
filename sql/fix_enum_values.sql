-- Add missing enum values to budget_status
ALTER TYPE budget_status ADD VALUE IF NOT EXISTS 'Em Análise';
ALTER TYPE budget_status ADD VALUE IF NOT EXISTS 'Enviado';
ALTER TYPE budget_status ADD VALUE IF NOT EXISTS 'Aprovado';
ALTER TYPE budget_status ADD VALUE IF NOT EXISTS 'Reprovado';
ALTER TYPE budget_status ADD VALUE IF NOT EXISTS 'Em Negociação';

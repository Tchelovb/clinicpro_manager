-- View: Lucro por Minuto (High Ticket Analysis)
-- Calcula o lucro líquido por minuto de cada procedimento
-- Essencial para identificar os procedimentos mais rentáveis

CREATE OR REPLACE VIEW view_profit_per_minute AS
SELECT
  p.id AS procedure_id,
  p.name AS procedure_name,
  p.category,
  p.estimated_time_minutes,
  p.base_price,
  
  -- Custos
  COALESCE(pc.material_cost, 0) AS material_cost,
  COALESCE(pc.professional_cost, 0) AS professional_cost,
  COALESCE(pc.operational_overhead, 0) AS operational_overhead,
  COALESCE(pc.total_cost, 0) AS total_cost,
  
  -- Taxas
  COALESCE(pc.tax_percent, 0) AS tax_percent,
  COALESCE(pc.card_fee_percent, 0) AS card_fee_percent,
  
  -- Cálculos de lucro
  (p.base_price * COALESCE(pc.tax_percent, 0) / 100) AS tax_amount,
  (p.base_price * COALESCE(pc.card_fee_percent, 0) / 100) AS card_fee_amount,
  
  (p.base_price - 
   COALESCE(pc.total_cost, 0) - 
   (p.base_price * COALESCE(pc.tax_percent, 0) / 100) -
   (p.base_price * COALESCE(pc.card_fee_percent, 0) / 100)
  ) AS net_profit,
  
  -- Lucro por minuto
  CASE 
    WHEN p.estimated_time_minutes > 0 THEN
      (p.base_price - 
       COALESCE(pc.total_cost, 0) - 
       (p.base_price * COALESCE(pc.tax_percent, 0) / 100) -
       (p.base_price * COALESCE(pc.card_fee_percent, 0) / 100)
      ) / p.estimated_time_minutes
    ELSE 0
  END AS profit_per_minute,
  
  -- Margem percentual
  CASE 
    WHEN p.base_price > 0 THEN
      ((p.base_price - 
        COALESCE(pc.total_cost, 0) - 
        (p.base_price * COALESCE(pc.tax_percent, 0) / 100) -
        (p.base_price * COALESCE(pc.card_fee_percent, 0) / 100)
       ) / p.base_price * 100)
    ELSE 0
  END AS margin_percent,
  
  -- Flags
  p.is_high_ticket,
  p.requires_lab,
  
  -- Metadados
  p.clinic_id,
  p.created_at,
  p.updated_at

FROM procedure p
LEFT JOIN procedure_costs pc ON pc.procedure_id = p.id
WHERE p.base_price > 0
ORDER BY profit_per_minute DESC NULLS LAST;

-- Comentários
COMMENT ON VIEW view_profit_per_minute IS 'Análise de lucratividade por minuto de cada procedimento. Usado para identificar os procedimentos mais rentáveis e otimizar a agenda.';

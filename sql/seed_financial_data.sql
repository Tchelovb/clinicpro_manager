-- ============================================
-- SEED DATA - PLANO DE CONTAS PADRÃO
-- Dados Iniciais para Clínicas Odontológicas
-- ============================================

-- Função para popular dados iniciais de uma clínica
CREATE OR REPLACE FUNCTION seed_financial_data_for_clinic(p_clinic_id UUID)
RETURNS VOID AS $$
BEGIN
  -- ============================================
  -- 1. CATEGORIAS DE RECEITA
  -- ============================================
  
  -- Verificar se já existem categorias de receita
  IF NOT EXISTS (SELECT 1 FROM revenue_category WHERE clinic_id = p_clinic_id) THEN
    INSERT INTO revenue_category (clinic_id, name, active) VALUES
    (p_clinic_id, 'Tratamentos Odontológicos', true),
    (p_clinic_id, 'Ortodontia', true),
    (p_clinic_id, 'Implantodontia', true),
    (p_clinic_id, 'Harmonização Orofacial (HOF)', true),
    (p_clinic_id, 'Estética Dental', true),
    (p_clinic_id, 'Clareamento', true),
    (p_clinic_id, 'Prótese', true),
    (p_clinic_id, 'Endodontia', true),
    (p_clinic_id, 'Periodontia', true),
    (p_clinic_id, 'Cirurgia', true),
    (p_clinic_id, 'Radiologia', true),
    (p_clinic_id, 'Outras Receitas', true);
    
    RAISE NOTICE 'Categorias de Receita criadas para clínica %', p_clinic_id;
  END IF;

  -- ============================================
  -- 2. CATEGORIAS DE DESPESA
  -- ============================================
  
  -- Verificar se já existem categorias de despesa
  IF NOT EXISTS (SELECT 1 FROM expense_category WHERE clinic_id = p_clinic_id) THEN
    INSERT INTO expense_category (clinic_id, name, active, is_variable_cost) VALUES
    -- Custos Fixos
    (p_clinic_id, 'Aluguel', true, false),
    (p_clinic_id, 'Energia Elétrica', true, false),
    (p_clinic_id, 'Água', true, false),
    (p_clinic_id, 'Internet/Telefone', true, false),
    (p_clinic_id, 'Salários e Encargos', true, false),
    (p_clinic_id, 'Contador', true, false),
    (p_clinic_id, 'Software/Sistemas', true, false),
    (p_clinic_id, 'Seguros', true, false),
    (p_clinic_id, 'Manutenção Equipamentos', true, false),
    (p_clinic_id, 'Marketing e Publicidade', true, false),
    
    -- Custos Variáveis
    (p_clinic_id, 'Material Odontológico', true, true),
    (p_clinic_id, 'Laboratório Protético', true, true),
    (p_clinic_id, 'Medicamentos', true, true),
    (p_clinic_id, 'Material de Limpeza', true, true),
    (p_clinic_id, 'Material de Escritório', true, true),
    (p_clinic_id, 'Descartáveis (Luvas, Máscaras)', true, true),
    (p_clinic_id, 'Anestésicos', true, true),
    (p_clinic_id, 'Radiologia (Filmes/Sensores)', true, true),
    
    -- Administrativo
    (p_clinic_id, 'Taxas Bancárias', true, false),
    (p_clinic_id, 'Impostos', true, false),
    (p_clinic_id, 'Pró-labore', true, false),
    (p_clinic_id, 'Outras Despesas', true, false);
    
    RAISE NOTICE 'Categorias de Despesa criadas para clínica %', p_clinic_id;
  END IF;

  -- ============================================
  -- 3. FORMAS DE PAGAMENTO
  -- ============================================
  
  -- Verificar se já existem formas de pagamento
  IF NOT EXISTS (SELECT 1 FROM payment_method WHERE clinic_id = p_clinic_id) THEN
    INSERT INTO payment_method (clinic_id, name, active) VALUES
    (p_clinic_id, 'Dinheiro', true),
    (p_clinic_id, 'PIX', true),
    (p_clinic_id, 'Cartão de Débito', true),
    (p_clinic_id, 'Cartão de Crédito', true),
    (p_clinic_id, 'Boleto', true),
    (p_clinic_id, 'Transferência Bancária', true),
    (p_clinic_id, 'Cheque', true),
    (p_clinic_id, 'Convênio', true);
    
    RAISE NOTICE 'Formas de Pagamento criadas para clínica %', p_clinic_id;
  END IF;

  -- ============================================
  -- 4. TAXAS DE FORMAS DE PAGAMENTO
  -- ============================================
  
  -- Verificar se já existem taxas configuradas
  IF NOT EXISTS (SELECT 1 FROM payment_method_fees WHERE clinic_id = p_clinic_id) THEN
    INSERT INTO payment_method_fees (
      clinic_id, 
      payment_method_name, 
      payment_type, 
      fee_type, 
      fee_percent, 
      fee_fixed_amount,
      installments_allowed,
      max_installments,
      min_installment_value,
      active
    ) VALUES
    -- Dinheiro e PIX (sem taxa)
    (p_clinic_id, 'Dinheiro', 'CASH', 'PERCENTAGE', 0, 0, false, 1, 0, true),
    (p_clinic_id, 'PIX', 'PIX', 'PERCENTAGE', 0, 0, false, 1, 0, true),
    
    -- Débito (taxa média 1.5%)
    (p_clinic_id, 'Cartão de Débito', 'DEBIT', 'PERCENTAGE', 1.5, 0, false, 1, 0, true),
    
    -- Crédito à vista (taxa média 2.5%)
    (p_clinic_id, 'Cartão de Crédito à Vista', 'CREDIT', 'PERCENTAGE', 2.5, 0, false, 1, 0, true),
    
    -- Crédito parcelado (taxa média 3.5% ao mês)
    (p_clinic_id, 'Cartão de Crédito 2x', 'CREDIT', 'PERCENTAGE', 3.5, 0, true, 2, 100, true),
    (p_clinic_id, 'Cartão de Crédito 3x', 'CREDIT', 'PERCENTAGE', 3.8, 0, true, 3, 100, true),
    (p_clinic_id, 'Cartão de Crédito 4-6x', 'CREDIT', 'PERCENTAGE', 4.2, 0, true, 6, 100, true),
    (p_clinic_id, 'Cartão de Crédito 7-12x', 'CREDIT', 'PERCENTAGE', 4.8, 0, true, 12, 100, true),
    
    -- Boleto (taxa fixa)
    (p_clinic_id, 'Boleto', 'BOLETO', 'FIXED', 0, 3.50, false, 1, 0, true),
    
    -- Transferência (sem taxa)
    (p_clinic_id, 'Transferência Bancária', 'OTHER', 'PERCENTAGE', 0, 0, false, 1, 0, true);
    
    RAISE NOTICE 'Taxas de Pagamento configuradas para clínica %', p_clinic_id;
  END IF;

  -- ============================================
  -- 5. FORNECEDORES EXEMPLO
  -- ============================================
  
  -- Buscar IDs das categorias criadas
  DECLARE
    cat_material_id UUID;
    cat_laboratorio_id UUID;
    cat_medicamentos_id UUID;
  BEGIN
    SELECT id INTO cat_material_id FROM expense_category 
    WHERE clinic_id = p_clinic_id AND name = 'Material Odontológico' LIMIT 1;
    
    SELECT id INTO cat_laboratorio_id FROM expense_category 
    WHERE clinic_id = p_clinic_id AND name = 'Laboratório Protético' LIMIT 1;
    
    SELECT id INTO cat_medicamentos_id FROM expense_category 
    WHERE clinic_id = p_clinic_id AND name = 'Medicamentos' LIMIT 1;
    
    -- Verificar se já existem fornecedores
    IF NOT EXISTS (SELECT 1 FROM suppliers WHERE clinic_id = p_clinic_id) THEN
      INSERT INTO suppliers (clinic_id, name, cnpj_cpf, contact_name, phone, email, default_expense_category_id, is_active) VALUES
      (p_clinic_id, 'Dental Cremer', '82.641.325/0001-00', 'Comercial', '(11) 3000-0000', 'comercial@dentalcremer.com.br', cat_material_id, true),
      (p_clinic_id, 'S.S.White', '33.113.309/0001-47', 'Vendas', '(21) 2000-0000', 'vendas@sswhite.com.br', cat_material_id, true),
      (p_clinic_id, 'Angelus', '78.258.410/0001-79', 'Atendimento', '(41) 3000-0000', 'atendimento@angelus.ind.br', cat_material_id, true),
      (p_clinic_id, 'Laboratório Protético Local', NULL, 'João Silva', '(00) 90000-0000', 'contato@lablocal.com.br', cat_laboratorio_id, true),
      (p_clinic_id, 'Farmácia Dental', NULL, 'Maria Santos', '(00) 90000-0001', 'vendas@farmaciadental.com.br', cat_medicamentos_id, true);
      
      RAISE NOTICE 'Fornecedores exemplo criados para clínica %', p_clinic_id;
    END IF;
  END;

  RAISE NOTICE 'Seed data completo para clínica %', p_clinic_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON FUNCTION seed_financial_data_for_clinic(UUID) IS 'Popula dados financeiros iniciais (categorias, formas de pagamento, fornecedores) para uma clínica';

-- ============================================
-- EXEMPLO DE USO
-- ============================================

-- Para popular dados de uma clínica específica:
-- SELECT seed_financial_data_for_clinic('uuid-da-clinica-aqui');

-- Para popular dados de TODAS as clínicas que ainda não têm:
-- SELECT seed_financial_data_for_clinic(id) FROM clinics WHERE id NOT IN (SELECT DISTINCT clinic_id FROM revenue_category);

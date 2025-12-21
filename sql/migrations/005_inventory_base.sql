-- =====================================================
-- MIGRATION 005: ESTOQUE (INVENTORY) - BASE
-- Prioridade: P2
-- Data: 21/12/2025
-- =====================================================

-- Tabela de Categorias de Estoque
CREATE TABLE IF NOT EXISTS public.inventory_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabela de Itens de Estoque
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.inventory_categories(id),
  
  name text NOT NULL,
  description text,
  sku text, -- Código do produto
  barcode text,
  
  -- Unidade de Medida
  unit_of_measure text DEFAULT 'UNIT' CHECK (unit_of_measure IN ('UNIT', 'BOX', 'KG', 'G', 'ML', 'L', 'METER', 'OTHER')),
  
  -- Estoque
  current_stock numeric DEFAULT 0 CHECK (current_stock >= 0),
  minimum_stock numeric DEFAULT 0,
  maximum_stock numeric,
  
  -- Financeiro
  unit_cost numeric DEFAULT 0,
  selling_price numeric DEFAULT 0,
  
  -- Fornecedor
  supplier_name text,
  supplier_contact text,
  
  -- Status
  is_active boolean DEFAULT true,
  requires_prescription boolean DEFAULT false,
  is_controlled boolean DEFAULT false,
  
  -- Auditoria
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  PRIMARY KEY (id)
);

-- Tabela de Movimentações de Estoque
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  inventory_item_id uuid NOT NULL REFERENCES public.inventory_items(id),
  
  movement_type text NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'LOSS', 'RETURN')),
  
  quantity numeric NOT NULL,
  unit_cost numeric DEFAULT 0,
  total_cost numeric DEFAULT 0,
  
  -- Referências
  reference_type text CHECK (reference_type IN ('PURCHASE', 'SALE', 'PROCEDURE', 'ADJUSTMENT', 'OTHER')),
  reference_id uuid, -- ID do procedimento, compra, etc
  
  -- Detalhes
  reason text,
  notes text,
  
  -- Estoque Anterior e Novo
  stock_before numeric,
  stock_after numeric,
  
  -- Auditoria
  performed_by uuid REFERENCES public.users(id),
  performed_at timestamp with time zone DEFAULT now(),
  
  PRIMARY KEY (id)
);

-- Índices
CREATE INDEX idx_inventory_items_clinic ON public.inventory_items(clinic_id, is_active);
CREATE INDEX idx_inventory_items_category ON public.inventory_items(category_id);
CREATE INDEX idx_inventory_items_low_stock ON public.inventory_items(clinic_id, current_stock, minimum_stock)
  WHERE current_stock <= minimum_stock AND is_active = true;

CREATE INDEX idx_inventory_movements_item ON public.inventory_movements(inventory_item_id, performed_at DESC);
CREATE INDEX idx_inventory_movements_clinic ON public.inventory_movements(clinic_id, performed_at DESC);

-- Trigger para atualizar estoque automaticamente
CREATE OR REPLACE FUNCTION update_inventory_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Registrar estoque antes
  NEW.stock_before := (SELECT current_stock FROM public.inventory_items WHERE id = NEW.inventory_item_id);
  
  -- Atualizar estoque
  IF NEW.movement_type IN ('IN', 'RETURN') THEN
    UPDATE public.inventory_items
    SET current_stock = current_stock + NEW.quantity,
        updated_at = now()
    WHERE id = NEW.inventory_item_id;
  ELSIF NEW.movement_type IN ('OUT', 'LOSS') THEN
    UPDATE public.inventory_items
    SET current_stock = current_stock - NEW.quantity,
        updated_at = now()
    WHERE id = NEW.inventory_item_id;
  ELSIF NEW.movement_type = 'ADJUSTMENT' THEN
    UPDATE public.inventory_items
    SET current_stock = NEW.quantity,
        updated_at = now()
    WHERE id = NEW.inventory_item_id;
  END IF;
  
  -- Registrar estoque depois
  NEW.stock_after := (SELECT current_stock FROM public.inventory_items WHERE id = NEW.inventory_item_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inventory_stock
BEFORE INSERT ON public.inventory_movements
FOR EACH ROW
EXECUTE FUNCTION update_inventory_stock();

-- Trigger para criar alerta quando estoque baixo
CREATE OR REPLACE FUNCTION create_alert_on_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_stock <= NEW.minimum_stock AND NEW.is_active = true THEN
    INSERT INTO public.ai_insights (
      clinic_id,
      category,
      title,
      explanation,
      priority,
      action_label,
      action_type,
      related_entity_id,
      status
    ) VALUES (
      NEW.clinic_id,
      'operational',
      'Estoque Baixo',
      format('O item "%s" está com estoque baixo (%s unidades). Estoque mínimo: %s. Reabasteça urgentemente.',
        NEW.name, NEW.current_stock, NEW.minimum_stock),
      CASE 
        WHEN NEW.current_stock = 0 THEN 'critico'
        WHEN NEW.current_stock <= NEW.minimum_stock * 0.5 THEN 'high'
        ELSE 'medium'
      END,
      'Reabastecer',
      'restock',
      NEW.id,
      'open'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_alert_low_stock
AFTER UPDATE ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION create_alert_on_low_stock();

-- View para itens com estoque baixo
CREATE OR REPLACE VIEW low_stock_items_view AS
SELECT 
  ii.id,
  ii.clinic_id,
  ii.name,
  ii.sku,
  ii.current_stock,
  ii.minimum_stock,
  ii.unit_cost,
  ii.supplier_name,
  ic.name as category_name,
  CASE 
    WHEN ii.current_stock = 0 THEN 'OUT_OF_STOCK'
    WHEN ii.current_stock <= ii.minimum_stock * 0.5 THEN 'CRITICAL'
    ELSE 'LOW'
  END as stock_status
FROM public.inventory_items ii
LEFT JOIN public.inventory_categories ic ON ii.category_id = ic.id
WHERE ii.current_stock <= ii.minimum_stock
  AND ii.is_active = true
ORDER BY ii.current_stock ASC;

COMMENT ON TABLE public.inventory_items IS 'Itens de estoque da clínica';
COMMENT ON TABLE public.inventory_movements IS 'Movimentações de entrada e saída de estoque';
COMMENT ON VIEW low_stock_items_view IS 'View de itens com estoque baixo para alertas';

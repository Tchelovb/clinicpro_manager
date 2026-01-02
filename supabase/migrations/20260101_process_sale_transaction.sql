-- Adiciona a coluna sale_id na tabela de tratamentos para linkar com a venda
ALTER TABLE public.treatment_items 
ADD COLUMN IF NOT EXISTS sale_id uuid REFERENCES public.sales(id);

-- Garante que a coluna installments_count existe na tabela sales
ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS installments_count integer DEFAULT 1;

-- Função para processar a venda de forma atômica
CREATE OR REPLACE FUNCTION process_sale_transaction(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Roda com permissões de sistema para garantir as gravações
AS $$
DECLARE
  v_sale_id uuid;
  v_budget_id uuid;
  v_patient_id uuid;
  v_clinic_id uuid;
  v_user_id uuid;
  rec record;
BEGIN
  -- Extrair IDs básicos do payload para variáveis
  v_budget_id := (payload->>'budget_id')::uuid;
  v_patient_id := (payload->>'patient_id')::uuid;
  v_clinic_id := (payload->>'clinic_id')::uuid;
  v_user_id := (payload->>'created_by')::uuid;

  -- 1. CRIAR O REGISTRO DE VENDA (SALES)
  INSERT INTO public.sales (
    clinic_id,
    patient_id,
    budget_id,
    total_value,
    discount_value,
    final_value,
    payment_method,
    installments_count,
    status,
    created_by
  )
  VALUES (
    v_clinic_id,
    v_patient_id,
    v_budget_id,
    (payload->>'total_value')::numeric,
    (payload->>'discount_value')::numeric,
    (payload->>'final_value')::numeric,
    payload->>'payment_method',
    (payload->>'installments_count')::integer,
    'COMPLETED',
    v_user_id
  )
  RETURNING id INTO v_sale_id;

  -- 2. ATUALIZAR STATUS DO ORÇAMENTO
  UPDATE public.budgets 
  SET 
    status = 'APPROVED', 
    updated_at = now()
  WHERE id = v_budget_id;

  -- 3. GERAR A FICHA CLÍNICA (TREATMENT_ITEMS)
  -- Lemos o array 'clinical_items' que vem do frontend
  IF jsonb_array_length(payload->'clinical_items') > 0 THEN
    INSERT INTO public.treatment_items (
      patient_id,
      budget_id,
      sale_id, -- Linkamos com a venda recém criada
      procedure_name,
      region,
      face,
      unit_value,
      total_value,
      quantity,
      status,
      created_at,
      updated_at
    )
    SELECT
      v_patient_id,
      v_budget_id,
      v_sale_id,
      (item->>'procedure_name'),
      (item->>'region'),
      (item->>'face'),
      (item->>'unit_value')::numeric,
      (item->>'total_value')::numeric,
      (item->>'quantity')::integer,
      'NOT_STARTED', -- Começa como "Não Iniciado"
      now(),
      now()
    FROM jsonb_array_elements(payload->'clinical_items') AS item;
  END IF;

  -- 4. GERAR O FINANCEIRO (FINANCIAL_INSTALLMENTS)
  -- Lemos o array 'installments_data' já calculado pelo frontend
  IF jsonb_array_length(payload->'installments_data') > 0 THEN
    INSERT INTO public.financial_installments (
      clinic_id,
      patient_id,
      budget_id,
      description,
      amount,
      due_date,
      installment_number,
      total_installments,
      payment_method,
      status,
      created_at
    )
    SELECT
      v_clinic_id,
      v_patient_id,
      v_budget_id,
      (inst->>'description'),
      (inst->>'amount')::numeric,
      (inst->>'due_date')::date,
      (inst->>'installment_number')::integer,
      (payload->>'installments_count')::integer,
      payload->>'payment_method',
      'PENDING', -- Começa como Pendente (a receber)
      now()
    FROM jsonb_array_elements(payload->'installments_data') AS inst;
  END IF;

  -- Retorna sucesso
  RETURN jsonb_build_object('success', true, 'sale_id', v_sale_id);

EXCEPTION WHEN OTHERS THEN
  -- Se der erro em QUALQUER passo, o banco desfaz tudo (Rollback automático)
  RAISE EXCEPTION 'Erro ao processar venda: %', SQLERRM;
END;
$$;

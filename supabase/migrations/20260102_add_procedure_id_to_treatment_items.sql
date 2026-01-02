-- CORREÇÃO COMPLETA DE COLUNAS FALTANTES (Sales Terminal Fix)

-- 1. Garantir colunas na tabela treatment_items
ALTER TABLE public.treatment_items 
ADD COLUMN IF NOT EXISTS procedure_id uuid REFERENCES public.procedure(id),
ADD COLUMN IF NOT EXISTS region text,
ADD COLUMN IF NOT EXISTS face text,
ADD COLUMN IF NOT EXISTS quantity integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS unit_value numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_value numeric DEFAULT 0;

-- 2. Garantir colunas na tabela financial_installments
ALTER TABLE public.financial_installments
ADD COLUMN IF NOT EXISTS budget_id uuid REFERENCES public.budgets(id),
ADD COLUMN IF NOT EXISTS installment_number integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_installments integer DEFAULT 1;

-- 3. Atualizar a função process_sale_transaction (Versão Blindada)
CREATE OR REPLACE FUNCTION process_sale_transaction(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sale_id uuid;
  v_budget_id uuid;
  v_patient_id uuid;
  v_clinic_id uuid;
  v_user_id uuid;
BEGIN
  -- Extrair IDs
  v_budget_id := (payload->>'budget_id')::uuid;
  v_patient_id := (payload->>'patient_id')::uuid;
  v_clinic_id := (payload->>'clinic_id')::uuid;
  v_user_id := (payload->>'created_by')::uuid;

  -- 1. CRIAR A VENDA
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
    COALESCE((payload->>'total_value')::numeric, 0),
    COALESCE((payload->>'discount_value')::numeric, 0),
    COALESCE((payload->>'final_value')::numeric, 0),
    payload->>'payment_method',
    COALESCE((payload->>'installments_count')::integer, 1),
    'COMPLETED',
    v_user_id
  )
  RETURNING id INTO v_sale_id;

  -- 2. ATUALIZAR O ORÇAMENTO
  UPDATE public.budgets 
  SET status = 'APPROVED', updated_at = now()
  WHERE id = v_budget_id;

  -- 3. GERAR FICHA CLÍNICA
  IF jsonb_array_length(payload->'clinical_items') > 0 THEN
    INSERT INTO public.treatment_items (
      patient_id,
      budget_id,
      sale_id,
      procedure_id,
      procedure_name,
      region,
      face,
      unit_value, 
      total_value,
      quantity,
      status,
      category,
      created_at,
      updated_at
    )
    SELECT
      v_patient_id,
      v_budget_id,
      v_sale_id,
      (item->>'procedure_id')::uuid,
      (item->>'procedure_name'),
      (item->>'region'),
      (item->>'face'),
      COALESCE((item->>'unit_value')::numeric, 0),
      COALESCE((item->>'total_value')::numeric, 0),
      COALESCE((item->>'quantity')::integer, 1),
      'NOT_STARTED',
      'CLINICA_GERAL', 
      now(),
      now()
    FROM jsonb_array_elements(payload->'clinical_items') AS item;
  END IF;

  -- 4. GERAR FINANCEIRO
  IF jsonb_array_length(payload->'installments_data') > 0 THEN
    INSERT INTO public.financial_installments (
      clinic_id,
      patient_id,
      budget_id, -- Agora existe
      description,
      amount,
      due_date,
      installment_number, -- Agora existe
      total_installments, -- Agora existe
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
      (payload->>'installments_count')::integer, -- Total de parcelas da venda
      payload->>'payment_method',
      'PENDING',
      now()
    FROM jsonb_array_elements(payload->'installments_data') AS inst;
  END IF;

  RETURN jsonb_build_object('success', true, 'sale_id', v_sale_id);

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Erro ao processar venda: %', SQLERRM;
END;
$$;

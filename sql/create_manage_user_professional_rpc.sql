CREATE OR REPLACE FUNCTION public.manage_user_professional(
  p_active BOOLEAN,
  p_clinic_id UUID,
  p_color TEXT,
  p_email TEXT,
  p_link_professional_id UUID,
  p_name TEXT,
  p_professional_data JSONB,
  p_role TEXT,
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_professional_id UUID;
  v_user_id UUID;
  v_new_id UUID;
BEGIN
  -- Generate ID if null
  v_new_id := COALESCE(p_user_id, gen_random_uuid());

  -- 1. Upsert na tabela de usuários
  INSERT INTO public.users (
    id, 
    clinic_id, 
    email, 
    name, 
    role, 
    active, 
    professional_id,
    is_clinical_provider, -- Define se é Dentista
    is_sales_rep          -- Define se é Vendedor
  )
  VALUES (
    v_new_id, 
    p_clinic_id, 
    p_email, 
    p_name, 
    p_role, -- removed ::role cast to be safer as text, usually role is text in previous context
    p_active, 
    p_link_professional_id,
    COALESCE((p_professional_data->>'is_clinical_provider')::BOOLEAN, false),
    COALESCE((p_professional_data->>'is_sales_rep')::BOOLEAN, false)
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    active = EXCLUDED.active,
    professional_id = EXCLUDED.professional_id,
    is_clinical_provider = EXCLUDED.is_clinical_provider,
    is_sales_rep = EXCLUDED.is_sales_rep,
    updated_at = NOW()
  RETURNING id INTO v_user_id;

  -- 2. Se for um provedor clínico, gerencia a tabela professionals
  IF (p_professional_data->>'is_clinical_provider')::BOOLEAN THEN
    INSERT INTO public.professionals (
      id, 
      clinic_id, 
      name, 
      specialty, 
      council,
      crc,
      photo_url,
      is_active, 
      color
    )
    VALUES (
      COALESCE(p_link_professional_id, gen_random_uuid()), 
      p_clinic_id, 
      p_name, 
      p_professional_data->>'specialty',
      p_professional_data->>'council_type',
      p_professional_data->>'council_number',
      p_professional_data->>'photo_url',
      p_active, 
      p_color
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      specialty = EXCLUDED.specialty,
      is_active = EXCLUDED.is_active,
      color = EXCLUDED.color,
      updated_at = NOW()
    RETURNING id INTO v_professional_id;

    -- Vincula o professional_id de volta ao usuário
    UPDATE public.users SET professional_id = v_professional_id WHERE id = v_user_id;
  END IF;

  RETURN jsonb_build_object('user_id', v_user_id, 'professional_id', v_professional_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

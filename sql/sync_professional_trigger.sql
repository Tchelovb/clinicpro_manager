-- Trigger Inteligente: Sincroniza Usuário -> Profissional
CREATE OR REPLACE FUNCTION public.sync_user_to_professional()
RETURNS TRIGGER AS $$
BEGIN
  -- Verifica se o usuário tem papel clínico (dentista, médico, etc)
  -- Ajuste os roles conforme seu sistema ('dentist', 'doctor', 'specialist', 'professional')
  IF NEW.role IN ('dentist', 'doctor', 'specialist', 'professional') THEN
    
    -- Verifica se já existe para não duplicar
    IF NOT EXISTS (SELECT 1 FROM public.professionals WHERE id = NEW.id) THEN
      
      INSERT INTO public.professionals (
        id,           -- Mesmo ID do usuário (Vínculo Forte)
        clinic_id,    -- Mesma clínica
        name,         -- Mesmo nome
        is_active,
        created_at,
        updated_at
      ) VALUES (
        NEW.id,
        NEW.clinic_id,
        NEW.name,
        true,
        NOW(),
        NOW()
      );
      
      -- Atualiza o usuário para linkar de volta (redundância de segurança)
      -- NOTE: Ensure professional_id column exists in users table, otherwise this might fail if schema differs.
      -- Based on Master Plan, we assume it does or is desired.
      -- If it fails, we might need to check schema.
      UPDATE public.users 
      SET professional_id = NEW.id 
      WHERE id = NEW.id;
      
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cria o Gatilho (Dispara a cada novo usuário criado)
DROP TRIGGER IF EXISTS on_user_created_sync_professional ON public.users;
CREATE TRIGGER on_user_created_sync_professional
  AFTER INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_to_professional();

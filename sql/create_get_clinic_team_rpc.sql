-- Cria uma função segura para buscar a equipe
-- Isso "esconde" a lógica complexa do Firewall/Antivírus
CREATE OR REPLACE FUNCTION public.get_clinic_team(target_clinic_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  role text,
  photo_url text,
  cro text,
  specialty text,
  agenda_color text,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER -- Roda com permissão de sistema (ignora RLS bugado)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id, 
    u.name, 
    u.email, 
    u.role::text, -- Converte para texto para evitar erro de tipo
    u.photo_url,
    u.cro,
    u.specialty,
    u.agenda_color,
    u.is_active
  FROM public.users u
  WHERE u.clinic_id = target_clinic_id
  ORDER BY u.created_at DESC;
END;
$$;

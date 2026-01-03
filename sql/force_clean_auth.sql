-- Limpeza Robusta de Metadados (Ignora Maiúsculas/Minúsculas)
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - 'photo_url' - 'avatar_url'
WHERE email ILIKE 'admin@%';

-- Verifica se funcionou (deve retornar os usuários afetados)
SELECT email, raw_user_meta_data 
FROM auth.users 
WHERE email ILIKE 'admin@%';

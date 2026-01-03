-- 1. Cria o balde de armazenamento 'avatars' se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Permite que QUALQUER UM veja as fotos (para aparecerem no site)
-- Dropa policy antiga para evitar conflito se já tentou rodar antes
DROP POLICY IF EXISTS "Avatar Publico" ON storage.objects;
CREATE POLICY "Avatar Publico"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- 3. Permite que usuários LOGADOS façam upload
DROP POLICY IF EXISTS "Upload Autenticado" ON storage.objects;
CREATE POLICY "Upload Autenticado"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- 4. Permite que usuários atualizem suas próprias fotos
DROP POLICY IF EXISTS "Update Próprio" ON storage.objects;
CREATE POLICY "Update Próprio"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );


-- Função para identificar admin pelo telefone
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND telefone = '861403004'
  );
$$;

-- Adicionar colunas em trabalhos
ALTER TABLE public.trabalhos
  ADD COLUMN IF NOT EXISTS tipo_fonte text NOT NULL DEFAULT 'internet'
    CHECK (tipo_fonte IN ('internet','anexo')),
  ADD COLUMN IF NOT EXISTS anexos jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS titulo text;

-- Permitir UPDATE/DELETE pelo dono
DROP POLICY IF EXISTS "own trabalhos update" ON public.trabalhos;
CREATE POLICY "own trabalhos update" ON public.trabalhos
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Admin pode ver/actualizar todos os trabalhos (em especial os com anexos)
DROP POLICY IF EXISTS "admin read trabalhos" ON public.trabalhos;
CREATE POLICY "admin read trabalhos" ON public.trabalhos
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "admin update trabalhos" ON public.trabalhos;
CREATE POLICY "admin update trabalhos" ON public.trabalhos
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Admin pode criar notificações para qualquer utilizador (entrega)
DROP POLICY IF EXISTS "admin insert notifications" ON public.notifications;
CREATE POLICY "admin insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

-- Storage policies para bucket trabalhos-anexos
-- Aluno faz upload na sua própria pasta: {user_id}/{filename}
CREATE POLICY "user upload own anexos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'trabalhos-anexos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "user read own anexos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'trabalhos-anexos'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.is_admin(auth.uid())
  )
);

CREATE POLICY "admin upload entregas"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'trabalhos-anexos'
  AND public.is_admin(auth.uid())
);

CREATE POLICY "user delete own anexos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'trabalhos-anexos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

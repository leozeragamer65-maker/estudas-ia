
ALTER TABLE public.chats DROP CONSTRAINT IF EXISTS chats_seccao_check;
ALTER TABLE public.chats ADD CONSTRAINT chats_seccao_check 
CHECK (seccao = ANY (ARRAY['geral'::text, 'trabalho'::text, 'matematica'::text, 'traducao'::text, 'resumo'::text, 'corretor'::text]));

CREATE POLICY "own usage insert" ON public.usage_daily
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "own usage update" ON public.usage_daily
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT INSERT, UPDATE ON public.usage_daily TO authenticated;

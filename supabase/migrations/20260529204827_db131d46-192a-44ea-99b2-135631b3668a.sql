
-- Webhook logs (EscalePay)
CREATE TABLE public.webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  payload jsonb NOT NULL,
  processed boolean NOT NULL DEFAULT false,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.webhook_logs TO service_role;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
-- No policies = no client access. Only service_role (which bypasses RLS) can read/write.

-- Missing INSERT policies so authenticated user can insert their own rows
CREATE POLICY "own messages insert"
ON public.mensagens FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "own messages delete"
ON public.mensagens FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "own notifs insert"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow service_role full access on profiles/notifications/transactions (used by webhook)
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.notifications TO service_role;
GRANT ALL ON public.transactions TO service_role;

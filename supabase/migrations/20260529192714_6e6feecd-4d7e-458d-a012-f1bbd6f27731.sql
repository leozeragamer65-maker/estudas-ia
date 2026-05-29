
-- Profiles linked to auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  telefone TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL DEFAULT '',
  plano TEXT NOT NULL DEFAULT 'free' CHECK (plano IN ('free','75mt','150mt')),
  plano_expira TIMESTAMPTZ,
  trabalhos_disponiveis INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Daily usage tracking (resets per day per user)
CREATE TABLE public.usage_daily (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dia DATE NOT NULL DEFAULT CURRENT_DATE,
  chat INT NOT NULL DEFAULT 0,
  matematica INT NOT NULL DEFAULT 0,
  traducao INT NOT NULL DEFAULT 0,
  resumo INT NOT NULL DEFAULT 0,
  trabalhos INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, dia)
);
GRANT SELECT, INSERT, UPDATE ON public.usage_daily TO authenticated;
GRANT ALL ON public.usage_daily TO service_role;
ALTER TABLE public.usage_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own usage read" ON public.usage_daily FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Chats
CREATE TABLE public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL DEFAULT 'Nova conversa',
  seccao TEXT NOT NULL DEFAULT 'geral' CHECK (seccao IN ('geral','trabalho')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX chats_user_idx ON public.chats(user_id, updated_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chats TO authenticated;
GRANT ALL ON public.chats TO service_role;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own chats all" ON public.chats FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Messages
CREATE TABLE public.mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  conteudo TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX mensagens_chat_idx ON public.mensagens(chat_id, created_at);
GRANT SELECT, INSERT ON public.mensagens TO authenticated;
GRANT ALL ON public.mensagens TO service_role;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own messages read" ON public.mensagens FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Trabalhos científicos
CREATE TABLE public.trabalhos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id UUID REFERENCES public.chats(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','em_processamento','pronto')),
  dados_formulario JSONB NOT NULL DEFAULT '{}'::jsonb,
  ficheiro_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  entregue_em TIMESTAMPTZ
);
GRANT SELECT, INSERT ON public.trabalhos TO authenticated;
GRANT ALL ON public.trabalhos TO service_role;
ALTER TABLE public.trabalhos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own trabalhos read" ON public.trabalhos FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own trabalhos insert" ON public.trabalhos FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  corpo TEXT NOT NULL DEFAULT '',
  lida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX notif_user_idx ON public.notifications(user_id, created_at DESC);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifs" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own notifs update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Transactions
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  product_id TEXT,
  amount NUMERIC,
  currency TEXT DEFAULT 'MZN',
  status TEXT NOT NULL,
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tx read" ON public.transactions FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Trigger: create profile on signup, reading telefone+nome from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, telefone, nome)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'telefone', NEW.id::text),
    COALESCE(NEW.raw_user_meta_data->>'nome', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

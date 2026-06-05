
-- Avaliações
CREATE TABLE public.avaliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  estrelas integer NOT NULL CHECK (estrelas BETWEEN 1 AND 5),
  comentario text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.avaliacoes TO authenticated;
GRANT ALL ON public.avaliacoes TO service_role;
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own avaliacao read" ON public.avaliacoes FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own avaliacao insert" ON public.avaliacoes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own avaliacao update" ON public.avaliacoes FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin read avaliacoes" ON public.avaliacoes FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- Contatos ADM
CREATE TABLE public.contatos_admin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  telefone text NOT NULL,
  categoria text NOT NULL CHECK (categoria IN ('problema_tecnico','sugestao','duvida','parceria','denuncia','outro')),
  motivo text NOT NULL,
  mensagem text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.contatos_admin TO authenticated;
GRANT ALL ON public.contatos_admin TO service_role;
ALTER TABLE public.contatos_admin ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own contato insert" ON public.contatos_admin FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own contato read" ON public.contatos_admin FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admin read contatos" ON public.contatos_admin FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "admin update contatos" ON public.contatos_admin FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Quizzes
CREATE TABLE public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria text NOT NULL,
  pergunta text NOT NULL,
  opcoes jsonb NOT NULL,
  resposta_correta integer NOT NULL,
  explicacao text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.quizzes TO authenticated;
GRANT ALL ON public.quizzes TO service_role;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read quizzes" ON public.quizzes FOR SELECT TO authenticated USING (true);

-- Quiz respostas
CREATE TABLE public.quiz_respostas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  resposta integer NOT NULL,
  correta boolean NOT NULL,
  dia date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, quiz_id)
);
GRANT SELECT, INSERT ON public.quiz_respostas TO authenticated;
GRANT ALL ON public.quiz_respostas TO service_role;
ALTER TABLE public.quiz_respostas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own resp read" ON public.quiz_respostas FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own resp insert" ON public.quiz_respostas FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Seed quizzes
INSERT INTO public.quizzes (categoria, pergunta, opcoes, resposta_correta, explicacao) VALUES
('Educação financeira','O que é juros compostos?','["Juros sobre o capital inicial apenas","Juros sobre juros acumulados","Taxa fixa do banco","Imposto sobre poupança"]'::jsonb,1,'Juros compostos incidem sobre o capital + juros já acumulados.'),
('Educação financeira','Qual a primeira regra para poupar?','["Gastar primeiro, poupar depois","Poupar antes de gastar","Investir em ações","Pedir empréstimos"]'::jsonb,1,'Pague-se primeiro: separe a poupança antes das despesas.'),
('Educação financeira','O que é orçamento pessoal?','["Lista de dívidas","Plano de receitas e despesas","Conta no banco","Tipo de empréstimo"]'::jsonb,1,'Orçamento é o plano que organiza receitas e despesas.'),
('Tecnologia','O que significa IA?','["Internet Avançada","Inteligência Artificial","Informação Anônima","Interface Animada"]'::jsonb,1,'IA = Inteligência Artificial.'),
('Tecnologia','HTML é uma linguagem de:','["Programação","Marcação","Estilização","Base de dados"]'::jsonb,1,'HTML é linguagem de marcação para páginas web.'),
('Tecnologia','O que faz um servidor?','["Joga apenas","Atende pedidos de clientes","Cria imagens","Imprime documentos"]'::jsonb,1,'Servidor responde a pedidos de clientes na rede.'),
('Negócios','O que é ROI?','["Retorno sobre investimento","Risco operacional interno","Receita oficial","Registo de impostos"]'::jsonb,0,'ROI = Return on Investment, mede o retorno de um investimento.'),
('Negócios','B2B significa:','["Business to Buyer","Business to Business","Buy to Bank","Brand to Buyer"]'::jsonb,1,'B2B = empresa para empresa.'),
('Desenvolvimento pessoal','SMART em metas significa que devem ser:','["Simples e baratas","Específicas, mensuráveis, alcançáveis, relevantes e temporais","Sociais e modernas","Sérias e mentais"]'::jsonb,1,'Metas SMART são bem definidas em 5 critérios.'),
('Desenvolvimento pessoal','Qual hábito melhora o foco?','["Multitarefa constante","Sono adequado","Notificações ligadas","Pular refeições"]'::jsonb,1,'Sono adequado melhora foco e memória.'),
('Conhecimentos gerais','Capital de Moçambique?','["Beira","Maputo","Nampula","Pemba"]'::jsonb,1,'Maputo é a capital de Moçambique.'),
('Conhecimentos gerais','Quantos continentes existem?','["5","6","7","8"]'::jsonb,2,'Existem 7 continentes.'),
('Conhecimentos gerais','Maior oceano do mundo?','["Atlântico","Índico","Pacífico","Ártico"]'::jsonb,2,'O Pacífico é o maior oceano.'),
('Empreendedorismo','O que é MVP?','["Most Valuable Player","Minimum Viable Product","Master Value Plan","Marketing Value Process"]'::jsonb,1,'MVP é o Produto Mínimo Viável.'),
('Empreendedorismo','Pivotar significa:','["Desistir do negócio","Mudar de direção estratégica","Aumentar preços","Contratar mais"]'::jsonb,1,'Pivotar é mudar a direção do negócio com base em aprendizagens.');

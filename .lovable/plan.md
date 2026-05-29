
# EstudaIA — MVP

App académico em português de Moçambique. Hub de IA que roteia perguntas para 3 "agentes" (matemática, trabalhos científicos, questões gerais), com créditos diários por plano, render de matemática (KaTeX) e fluxo de pagamento.

## Stack
- **Frontend**: TanStack Start + Tailwind + shadcn/ui (já no template)
- **Backend**: Lovable Cloud (Supabase por baixo — auth, Postgres, server functions)
- **IA**: Lovable AI Gateway com `google/gemini-3-flash-preview` para os 3 agentes
- **Matemática**: `katex` + `react-katex` para renderizar `$...$` e `$$...$$`
- **Pagamentos**: Stripe (Lovable Cloud Payments) — *substitui o Escalepay no MVP*, porque o Escalepay exige credenciais externas. Posso integrar Escalepay depois com webhook.

## Decisões adaptadas ao Lovable Cloud
| Spec original | Substituto no MVP |
|---|---|
| Firebase Firestore | Postgres (Lovable Cloud) |
| Login com telefone+senha em texto, sem verificação | Lovable Auth por **telefone+senha** (gerido, com hash seguro) |
| `localStorage` para sessão | Sessão Supabase (já persistida) + RLS |
| Gemini API key própria | Lovable AI Gateway (sem chave) |
| Escalepay webhook | Stripe checkout (suporta MZN não nativamente — uso USD no MVP) |
| FCM notificações | Toasts in-app + tabela `notifications` (push real fora do MVP) |
| Telegram ADM | Tabela `admin_notifications` consultável no painel |

Vou marcar claramente no código onde estes substitutos estão.

## Estrutura de dados (Postgres)

```text
profiles            (id=auth.uid, nome, telefone, plano, plano_expira, trabalhos_disponiveis)
usage_daily         (user_id, dia, chat, matematica, traducao, resumo, trabalhos)
chats               (id, user_id, titulo, seccao, created_at)
mensagens           (id, chat_id, role, conteudo, created_at)  -- agente_usado NÃO exposto
trabalhos           (id, user_id, chat_id, status, dados_formulario, ficheiro_url, …)
transactions        (id, user_id, provider, amount, status, raw, …)
notifications       (id, user_id, titulo, corpo, lida, created_at)
```
Tudo com RLS: cada utilizador só vê os seus próprios registos.

## Rotas
```text
/                       landing pública
/login                  telefone + senha (signup + signin)
/_authenticated/app           layout com sidebar de chats
  ├─ /                  chat principal (questões gerais + matemática)
  └─ /trabalhos         secção "Trabalho Científico" (rota força agente DeepSeek-style)
/_authenticated/conta         plano, créditos, upgrade
/api/public/stripe-webhook   confirmar pagamentos
```

## Roteamento dos agentes (lado servidor)
- Server function `sendMessage` recebe `{ chatId, texto, seccao }`.
- Verifica créditos em `usage_daily` (com reset diário).
- Classifica:
  - `seccao === "trabalho"` → agente Trabalhos
  - regex/keywords matemáticos → agente Matemática
  - resto → agente Questões Gerais
- Cada agente é o **mesmo modelo** com **system prompt diferente** (português MZ, nunca revelar que é IA, nunca dizer qual agente).
- Resposta gravada em `mensagens`, créditos incrementados, devolvida ao cliente.

## Renderização de matemática
- Componente `<MessageContent>` faz parse de blocos `$$...$$` (display) e `$...$` (inline) com `react-katex`.
- System prompt do agente matemático instrui sempre LaTeX delimitado.

## Pagamentos
- Antes de implementar pago: corro `recommend_payment_provider`; se Stripe for adequado, ativo `enable_stripe_payments`.
- 3 produtos: `Plano 75MT (mensal)`, `Plano 150MT (mensal)`, `Trabalho Científico (avulso)`.
- Webhook em `/api/public/stripe-webhook` atualiza `profiles.plano` e `trabalhos_disponiveis`.
- **Nota**: vou expor isto como passo final; o resto da app funciona no plano grátis sem precisar de pagamento configurado.

## O que vou entregar nesta primeira iteração
1. Ativar Lovable Cloud
2. Schema Postgres + RLS + trigger de profile
3. Landing + login (telefone+senha)
4. Layout autenticado com sidebar de chats
5. Chat com roteamento dos 3 agentes via Lovable AI
6. KaTeX a renderizar respostas matemáticas
7. Sistema de créditos diários por plano
8. Página de conta + modal de upgrade
9. Estrutura para pagamentos (ativada se `recommend_payment_provider` aprovar)
10. Tabela de notificações + toasts

## Fora deste primeiro MVP (digo claramente no fim)
- Escalepay real (precisa credenciais e país de operação)
- Push notifications FCM reais
- Bot Telegram para ADM
- Geração real de ficheiro do trabalho científico (entrego o fluxo + estado "pendente/pronto"; geração do `.docx` fica para iteração seguinte)

Quer que eu avance com esta forma? Se sim, começo já a construir.

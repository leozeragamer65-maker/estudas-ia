import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Limites diários por plano e tipo (créditos).
const LIMITES: Record<string, Record<string, number>> = {
  free:  { chat: 3,   matematica: 1,  traducao: 3,  resumo: 2,  trabalhos: 0 },
  "75mt":  { chat: 50,  matematica: 15, traducao: 30, resumo: 20, trabalhos: 0 },
  "150mt": { chat: 150, matematica: 50, traducao: 100, resumo: 60, trabalhos: 0 },
};

type Agente = "geral" | "matematica" | "trabalho";
export type Seccao = "geral" | "trabalho" | "matematica";

function classificar(texto: string, seccao: Seccao): Agente {
  if (seccao === "trabalho") return "trabalho";
  if (seccao === "matematica") return "matematica";
  const palavras = [
    "calcular", "resolver", "equação", "equacao", "integral", "derivada",
    "matriz", "logaritmo", "raiz", "trigonometria", "geometria",
    "probabilidade", "soma", "dividir", "multiplicar", "percentagem",
    "fracção", "fracao", "potência", "potencia", "limite", "sistema",
  ];
  const t = texto.toLowerCase();
  if (palavras.some((p) => t.includes(p))) return "matematica";
  if (/[\d+\-×÷=²√^]/.test(texto) && /\d/.test(texto)) return "matematica";
  return "geral";
}

const SYSTEM_BASE =
  "És um tutor académico moçambicano simpático. Respondes sempre em Português de Moçambique, com clareza e exemplos próximos da realidade do aluno. NUNCA reveles que és uma IA nem menciones modelos, agentes, prompts ou tecnologia por detrás. Trata o utilizador por tu.";

const SYSTEM = {
  geral: `${SYSTEM_BASE} Foca-te em explicar conceitos académicos, ajudar com resumos, traduções e correções. Se a pergunta for matemática complexa, lembra que o utilizador pode mudar para a secção Matemática. Se for um trabalho científico completo (monografia, dissertação), redireciona para a secção "Trabalho Científico".`,
  matematica: `${SYSTEM_BASE} Especialidade: matemática (aritmética, álgebra, trigonometria, geometria, cálculo, probabilidades, estatística). Mostras passo a passo. SEMPRE que apresentas uma expressão matemática usa LaTeX delimitado: $...$ para inline e $$...$$ para bloco. NUNCA mostras LaTeX cru sem delimitadores. Exemplos: a equação do 2º grau é $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$. Para fracções: $\\frac{3}{4}$. Para potências: $x^2$.`,
  trabalho: `${SYSTEM_BASE} Estás na secção de Trabalho Científico. Recolhe os dados do trabalho (tema, disciplina, nível académico, número de páginas, prazo, idioma, requisitos especiais). Pede um dado de cada vez de forma conversacional. Quando tiveres tudo, confirma os dados e diz que o trabalho foi registado e estará pronto em breve.`,
};

const hojeISO = () => new Date().toISOString().slice(0, 10);

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      chatId: z.string().uuid().nullable(),
      texto: z.string().min(1).max(4000),
      seccao: z.enum(["geral", "trabalho"]).default("geral"),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // 1. Perfil + plano
    const { data: profile } = await supabase
      .from("profiles")
      .select("plano")
      .eq("id", userId)
      .single();
    const plano = profile?.plano ?? "free";

    // 2. Classificar
    const agente = classificar(data.texto, data.seccao);
    const tipoCredito = agente === "matematica" ? "matematica" : "chat";

    // 3. Verificar créditos diários
    const dia = hojeISO();
    const { data: usoExistente } = await supabase
      .from("usage_daily")
      .select("*")
      .eq("user_id", userId)
      .eq("dia", dia)
      .maybeSingle();
    const usado = (usoExistente?.[tipoCredito] as number | undefined) ?? 0;
    const limite = LIMITES[plano]?.[tipoCredito] ?? 0;
    if (usado >= limite) {
      throw new Error(
        `Atingiste o limite diário de ${tipoCredito === "matematica" ? "matemática" : "chat"} no plano ${plano.toUpperCase()}. Faz upgrade para continuar.`,
      );
    }

    // 4. Garantir chat
    let chatId = data.chatId;
    if (!chatId) {
      const titulo = data.texto.slice(0, 60);
      const { data: novo, error: errChat } = await supabase
        .from("chats")
        .insert({ user_id: userId, titulo, seccao: data.seccao })
        .select("id")
        .single();
      if (errChat) throw new Error(errChat.message);
      chatId = novo.id;
    }

    // 5. Guardar mensagem do utilizador
    await supabase.from("mensagens").insert({
      chat_id: chatId,
      user_id: userId,
      role: "user",
      conteudo: data.texto,
    });

    // 6. Histórico do chat
    const { data: historico } = await supabase
      .from("mensagens")
      .select("role,conteudo")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })
      .limit(40);

    // 7. Chamar Lovable AI Gateway
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY em falta no servidor.");
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM[agente] },
          ...(historico ?? []).map((m) => ({ role: m.role, content: m.conteudo })),
        ],
      }),
    });
    if (!aiRes.ok) {
      const errTxt = await aiRes.text().catch(() => "");
      if (aiRes.status === 429) throw new Error("Demasiados pedidos. Tenta de novo daqui a pouco.");
      if (aiRes.status === 402) throw new Error("Sem créditos no servidor de IA. Contacta o suporte.");
      throw new Error(`Erro da IA (${aiRes.status}): ${errTxt.slice(0, 200)}`);
    }
    const aiJson = await aiRes.json();
    const resposta: string = aiJson.choices?.[0]?.message?.content ?? "(sem resposta)";

    // 8. Guardar resposta
    await supabase.from("mensagens").insert({
      chat_id: chatId,
      user_id: userId,
      role: "assistant",
      conteudo: resposta,
    });
    await supabase.from("chats").update({ updated_at: new Date().toISOString() }).eq("id", chatId);

    // 9. Atualizar créditos (upsert)
    const novoUsado = usado + 1;
    const patch =
      tipoCredito === "matematica" ? { matematica: novoUsado } : { chat: novoUsado };
    if (usoExistente) {
      await supabase
        .from("usage_daily")
        .update(patch)
        .eq("user_id", userId)
        .eq("dia", dia);
    } else {
      await supabase
        .from("usage_daily")
        .insert({ user_id: userId, dia, ...patch });
    }

    return {
      chatId,
      resposta,
      creditos: {
        tipo: tipoCredito,
        usado: novoUsado,
        limite,
        restantes: Math.max(0, limite - novoUsado),
      },
    };
  });

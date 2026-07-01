import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Limites diários por plano e tipo de crédito.
const LIMITES: Record<string, Record<string, number>> = {
  free: { chat: 3, matematica: 1, traducao: 3, resumo: 2, trabalhos: 0 },
  "75mt": { chat: 50, matematica: 15, traducao: 30, resumo: 20, trabalhos: 0 },
  "150mt": { chat: 150, matematica: 50, traducao: 100, resumo: 60, trabalhos: 0 },
};

// URLs dos agentes externos.
const AGENT_URLS = {
  matematica: "https://mestre-matematico-amigo.lovable.app/api/agent/matematica",
  geral: "https://quest-wise-buddy-23.lovable.app/api/public/agent/questoes",
  trabalho: "https://estudo-moz-assist.lovable.app/api/public/agent/generate",
};

export type Seccao = "geral" | "trabalho" | "matematica" | "traducao" | "resumo" | "corretor";

// Mapa: secção -> { agente externo, tipo de crédito, prefixo de prompt }
const SECCAO_CFG: Record<
  Seccao,
  { agente: keyof typeof AGENT_URLS; credito: keyof (typeof LIMITES)["free"]; prefixo?: string }
> = {
  geral: { agente: "geral", credito: "chat" },
  trabalho: { agente: "trabalho", credito: "trabalhos" },
  matematica: { agente: "matematica", credito: "matematica" },
  traducao: {
    agente: "geral",
    credito: "traducao",
    prefixo:
      "Actua como tradutor profissional multilingue com suporte a QUALQUER língua do mundo (incluindo línguas menos comuns e dialectos). Traduz o texto seguinte de forma natural e fiel para a língua de destino indicada pelo utilizador — se não indicar, pergunta primeiro. Depois da tradução, adiciona uma secção **Explicação** (2-4 frases) em português de Moçambique explicando brevemente o sentido do texto traduzido, escolhas de tradução importantes e vocabulário que ajude o aluno a compreender melhor. Formato:\n\n**Tradução:**\n<texto traduzido>\n\n**Explicação:**\n<explicação breve>\n\nTexto original:\n\n",
  },
  resumo: {
    agente: "geral",
    credito: "resumo",
    prefixo:
      "Actua como assistente de estudo. Faz um resumo claro, estruturado por tópicos, das ideias principais do texto seguinte. Texto:\n\n",
  },
  corretor: {
    agente: "geral",
    credito: "chat",
    prefixo:
      "Actua como corrector de português. Corrige ortografia, gramática e estilo do texto seguinte e devolve a versão corrigida. Indica brevemente as principais correcções feitas. Texto:\n\n",
  },
};

const hojeISO = () => new Date().toISOString().slice(0, 10);

type Agente = keyof typeof AGENT_URLS;

async function chamarAgente(
  agente: Agente,
  chatId: string,
  userId: string,
  texto: string,
  historico: { role: string; conteudo: string }[],
  extras: { plano: string; creditos_restantes: number; nivel_academico?: string },
): Promise<string> {
  const url = AGENT_URLS[agente];
  const payload =
    agente === "matematica"
      ? { chat_id: chatId, utilizador_id: userId, questao: texto, historico }
      : {
          chat_id: chatId,
          utilizador_id: userId,
          tipo: "chat",
          mensagem: texto,
          pergunta: texto,
          nivel_academico: extras.nivel_academico ?? "geral",
          plano: extras.plano,
          creditos_restantes: extras.creditos_restantes,
          historico,
        };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Agente ${agente} indisponível (${res.status}): ${txt.slice(0, 200)}`);
  }

  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const j = await res.json();
    return (
      j.resposta ??
      j.resultado ??
      j.answer ??
      j.message ??
      j.content ??
      j.text ??
      (typeof j === "string" ? j : JSON.stringify(j))
    );
  }
  return await res.text();
}

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      chatId: z.string().uuid().nullable(),
      texto: z.string().min(1).max(8000),
      seccao: z
        .enum(["geral", "trabalho", "matematica", "traducao", "resumo", "corretor"])
        .default("geral"),
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

    // 2. Configuração da secção
    const cfg = SECCAO_CFG[data.seccao];
    const tipoCredito = cfg.credito;

    // 3. Verificar créditos diários
    const dia = hojeISO();
    const { data: usoExistente } = await supabase
      .from("usage_daily")
      .select("*")
      .eq("user_id", userId)
      .eq("dia", dia)
      .maybeSingle();
    const usado = (usoExistente as Record<string, number> | null)?.[tipoCredito] ?? 0;
    const limite = LIMITES[plano]?.[tipoCredito] ?? 0;
    if (usado >= limite) {
      throw new Error(
        `Atingiste o limite diário (${limite}) desta ferramenta no plano ${plano.toUpperCase()}. Faz upgrade para continuar.`,
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

    // 5. Guardar mensagem do utilizador (texto original, sem prefixo)
    await supabase.from("mensagens").insert({
      chat_id: chatId,
      user_id: userId,
      role: "user",
      conteudo: data.texto,
    });

    // 6. Contexto: apenas as últimas 5 respostas do agente para esta sessão
    //    (economiza tokens; histórico completo continua persistido no Supabase).
    const { data: ultimasRespostas } = await supabase
      .from("mensagens")
      .select("role,conteudo,created_at")
      .eq("chat_id", chatId)
      .eq("role", "assistant")
      .order("created_at", { ascending: false })
      .limit(5);
    const historico = (ultimasRespostas ?? [])
      .slice()
      .reverse()
      .map((m) => ({ role: m.role, conteudo: m.conteudo }));

    // 7. Texto enviado ao agente (com prefixo da ferramenta se existir)
    const textoAgente = cfg.prefixo ? cfg.prefixo + data.texto : data.texto;

    const resposta = await chamarAgente(cfg.agente, chatId!, userId, textoAgente, historico, {
      plano,
      creditos_restantes: Math.max(0, limite - usado),
    });

    // 8. Guardar resposta
    await supabase.from("mensagens").insert({
      chat_id: chatId,
      user_id: userId,
      role: "assistant",
      conteudo: resposta,
    });
    await supabase.from("chats").update({ updated_at: new Date().toISOString() }).eq("id", chatId);

    // 9. Atualizar créditos
    const novoUsado = usado + 1;
    const patch: any = { [tipoCredito]: novoUsado };
    if (usoExistente) {
      const { error: errU } = await supabase
        .from("usage_daily")
        .update(patch)
        .eq("user_id", userId)
        .eq("dia", dia);
      if (errU) console.error("usage_daily update:", errU.message);
    } else {
      const { error: errI } = await supabase
        .from("usage_daily")
        .insert({ user_id: userId, dia, ...patch });
      if (errI) console.error("usage_daily insert:", errI.message);
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

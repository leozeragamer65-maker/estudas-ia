import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Limites diários por plano e tipo (créditos).
const LIMITES: Record<string, Record<string, number>> = {
  free:  { chat: 3,   matematica: 1,  traducao: 3,  resumo: 2,  trabalhos: 0 },
  "75mt":  { chat: 50,  matematica: 15, traducao: 30, resumo: 20, trabalhos: 0 },
  "150mt": { chat: 150, matematica: 50, traducao: 100, resumo: 60, trabalhos: 0 },
};

// URLs dos agentes externos (cada um vive no seu projeto Lovable).
const AGENT_URLS = {
  matematica: "https://mestre-matematico-amigo.lovable.app/api/agent/matematica",
  geral: "https://quest-wise-buddy-23.lovable.app/api/public/agent/questoes",
  trabalho: "https://estudo-moz-assist.lovable.app/api/agent/generate",
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

const hojeISO = () => new Date().toISOString().slice(0, 10);

// Chamar um agente externo. Tenta vários formatos comuns de payload/resposta.
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
      ? {
          chat_id: chatId,
          utilizador_id: userId,
          questao: texto,
          historico,
        }
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
      texto: z.string().min(1).max(4000),
      seccao: z.enum(["geral", "trabalho", "matematica"]).default("geral"),
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

    // 7. Chamar agente externo
    const resposta = await chamarAgente(
      agente,
      chatId!,
      data.texto,
      historico ?? [],
    );

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

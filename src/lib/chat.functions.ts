import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SECCOES = [
  "geral",
  "trabalho",
  "matematica",
  "traducao",
  "resumo",
  "corretor",
] as const;

export const listChats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      seccao: z.enum(SECCOES).optional(),
    }).optional(),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let q = supabase
      .from("chats")
      .select("id,titulo,seccao,updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(50);
    if (data?.seccao) q = q.eq("seccao", data.seccao);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ chatId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: msgs, error } = await supabase
      .from("mensagens")
      .select("id,role,conteudo,created_at")
      .eq("chat_id", data.chatId)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return msgs ?? [];
  });

export const deleteChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ chatId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("chats")
      .delete()
      .eq("id", data.chatId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getProfileWithUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const dia = new Date().toISOString().slice(0, 10);
    const [{ data: profile }, { data: uso }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("usage_daily")
        .select("*")
        .eq("user_id", userId)
        .eq("dia", dia)
        .maybeSingle(),
    ]);
    const isAdmin = (profile as any)?.telefone === "861403004";
    return {
      profile,
      isAdmin,
      uso: uso ?? { chat: 0, matematica: 0, traducao: 0, resumo: 0, trabalhos: 0 },
    };
  });

export const submeterTrabalho = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      tema: z.string().min(3).max(300),
      disciplina: z.string().min(2).max(120),
      nivel: z.string().min(2).max(60),
      paginas: z.number().int().min(1).max(200),
      prazo: z.string().min(2).max(60),
      observacoes: z.string().max(2000).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("trabalhos_disponiveis")
      .eq("id", userId)
      .single();
    if (!profile || profile.trabalhos_disponiveis <= 0) {
      throw new Error(
        "Não tens trabalhos disponíveis. Compra um trabalho científico (50 MT) na página da Conta.",
      );
    }
    const { data: trabalho, error } = await supabase
      .from("trabalhos")
      .insert({
        user_id: userId,
        dados_formulario: data,
        status: "em_processamento",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await supabase
      .from("profiles")
      .update({ trabalhos_disponiveis: profile.trabalhos_disponiveis - 1 })
      .eq("id", userId);

    try {
      await fetch("https://estudo-moz-assist.lovable.app/api/agent/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trabalho_id: trabalho.id,
          user_id: userId,
          ...data,
        }),
      });
    } catch (e) {
      console.error("Falha ao chamar agente generate:", e);
    }

    await supabase.from("notifications").insert({
      user_id: userId,
      titulo: "Trabalho recebido",
      corpo: `O teu trabalho sobre "${data.tema}" foi registado. Vais ser notificado quando estiver pronto.`,
    });
    return { ok: true, trabalho_id: trabalho.id };
  });

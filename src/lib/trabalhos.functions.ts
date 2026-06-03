import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ADMIN_PHONE = "861403004";
const BUCKET = "trabalhos-anexos";

const dadosSchema = z.object({
  // Aluno
  nome_completo: z.string().min(2).max(200),
  turma: z.string().min(1).max(60),
  numero_aluno: z.string().min(1).max(40),
  // Instituição
  escola: z.string().min(2).max(200),
  curso: z.string().min(2).max(200),
  // Orientador
  orientador_nome: z.string().min(2).max(200),
  orientador_cargo: z.string().min(2).max(120),
  // Trabalho
  tema: z.string().min(3).max(300),
  nivel_academico: z.enum(["Médio", "Superior"]),
  paginas: z.number().int().min(8).max(200),
  formato_citacao: z.enum(["APA", "ABNT", "Vancouver"]),
  // Data
  mes: z.string().min(2).max(20),
  ano: z.number().int().min(2024).max(2100),
  cidade: z.string().min(2).max(120),
  // Extra
  instrucoes_extra: z.string().max(2000).optional().default(""),
});

export type DadosTrabalho = z.infer<typeof dadosSchema>;

export const createTrabalho = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      dados: dadosSchema,
      tipo_fonte: z.enum(["internet", "anexo"]),
      anexos: z
        .array(z.object({ path: z.string(), nome: z.string(), tamanho: z.number() }))
        .max(10)
        .default([]),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    if (data.tipo_fonte === "anexo" && data.anexos.length === 0)
      throw new Error("Anexa pelo menos um ficheiro (PDF/Word/Excel).");

    // Verificar trabalhos disponíveis
    const { data: profile } = await supabase
      .from("profiles")
      .select("trabalhos_disponiveis")
      .eq("id", userId)
      .single();
    if (!profile || profile.trabalhos_disponiveis <= 0) {
      throw new Error(
        "Não tens trabalhos disponíveis. Compra 1 trabalho científico (50 MT) na página de Planos.",
      );
    }

    // Cria trabalho com status inicial conforme tipo
    const status = data.tipo_fonte === "anexo" ? "aguardando_adm" : "em_processamento";
    const { data: trabalho, error } = await supabase
      .from("trabalhos")
      .insert({
        user_id: userId,
        dados_formulario: data.dados,
        tipo_fonte: data.tipo_fonte,
        anexos: data.anexos,
        titulo: data.dados.tema,
        status,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    // Desconta 1 trabalho disponível
    await supabase
      .from("profiles")
      .update({ trabalhos_disponiveis: profile.trabalhos_disponiveis - 1 })
      .eq("id", userId);

    // Internet: dispara o agente
    if (data.tipo_fonte === "internet") {
      try {
        await fetch("https://estudo-moz-assist.lovable.app/api/agent/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trabalho_id: trabalho.id,
            user_id: userId,
            ...data.dados,
          }),
        });
      } catch (e) {
        console.error("agente generate:", e);
      }
      await supabase.from("notifications").insert({
        user_id: userId,
        titulo: "Trabalho em processamento",
        corpo: `O teu trabalho "${data.dados.tema}" foi enviado para geração. Vais ser notificado quando estiver pronto.`,
      });
    } else {
      // Anexo: notifica o aluno + notifica o admin
      await supabase.from("notifications").insert({
        user_id: userId,
        titulo: "Pedido recebido (manual)",
        corpo: `O teu pedido "${data.dados.tema}" foi enviado ao administrador. Prazo máximo: 6 horas.`,
      });
      // Admin notification (via service role: usa update direct? Aqui não temos admin client; o admin verá no painel)
    }

    return { ok: true, trabalho_id: trabalho.id };
  });

export const listMyTrabalhos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("trabalhos")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ---- Upload de anexos (URL assinado para o aluno) ----
export const signAnexoUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      nome: z.string().min(1).max(200),
      tamanho: z.number().int().min(1).max(20 * 1024 * 1024),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const safe = data.nome.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${userId}/${Date.now()}-${safe}`;
    const { data: signed, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return { path, token: signed.token, signedUrl: signed.signedUrl };
  });

export const signDownload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ path: z.string() }))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: signed, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(data.path, 60 * 10);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });

// ---- Admin ----
async function ensureAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("telefone")
    .eq("id", userId)
    .single();
  if (data?.telefone !== ADMIN_PHONE) throw new Error("Acesso restrito ao administrador.");
}

export const adminListTrabalhos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const { data, error } = await supabase
      .from("trabalhos")
      .select("*")
      .eq("tipo_fonte", "anexo")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminSignUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({ trabalhoId: z.string().uuid(), nome: z.string().min(1).max(200) }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const safe = data.nome.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `entregas/${data.trabalhoId}/${Date.now()}-${safe}`;
    const { data: signed, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return { path, token: signed.token, signedUrl: signed.signedUrl };
  });

export const adminEntregar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({ trabalhoId: z.string().uuid(), ficheiroPath: z.string() }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const { data: t, error: e1 } = await supabase
      .from("trabalhos")
      .update({
        ficheiro_url: data.ficheiroPath,
        status: "entregue",
        entregue_em: new Date().toISOString(),
      })
      .eq("id", data.trabalhoId)
      .select("user_id, titulo, dados_formulario")
      .single();
    if (e1) throw new Error(e1.message);
    await supabase.from("notifications").insert({
      user_id: t.user_id,
      titulo: "Trabalho entregue ✅",
      corpo: `O teu trabalho "${t.titulo ?? (t.dados_formulario as any)?.tema ?? "científico"}" já está disponível em Trabalhos.`,
    });
    return { ok: true };
  });

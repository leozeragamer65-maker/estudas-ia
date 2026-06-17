import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const createTrabalho = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      data: z.object({
        dados: z.any(),
        tipo_fonte: z.enum(["internet", "anexo"]),
        anexos: z.array(z.any()).optional(),
        telefone: z.string().optional(),
      }),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Check user exists and get profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, telefone, trabalhos_disponiveis")
      .eq("id", userId)
      .single();

    if (!profile || profile.trabalhos_disponiveis <= 0) {
      throw new Error(
        "Não tens trabalhos disponíveis. Compra um trabalho científico (50 MT) em Planos.",
      );
    }

    // Create trabalho record
    const { data: trabalho, error } = await supabase
      .from("trabalhos")
      .insert({
        user_id: userId,
        dados_formulario: data.data.dados,
        tipo_fonte: data.data.tipo_fonte,
        anexos: data.data.anexos || [],
        status: data.data.tipo_fonte === "internet" ? "gerando" : "pendente_adm",
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    // Decrement trabalhos_disponiveis
    await supabase
      .from("profiles")
      .update({ trabalhos_disponiveis: profile.trabalhos_disponiveis - 1 })
      .eq("id", userId);

    // If internet mode, call external agent with callback_url including telefone
    if (data.data.tipo_fonte === "internet") {
      const telefoneUsuario = data.data.telefone || profile.telefone || "";
      const callbackUrl = `https://estudas-ia.lovable.app/api/public/trabalhos/receber?telefone=${encodeURIComponent(telefoneUsuario)}`;

      try {
        await fetch("https://estudo-moz-assist.lovable.app/api/public/agent/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trabalho_id: trabalho.id,
            utilizador_id: userId,
            callback_url: callbackUrl,
            ...data.data.dados,
          }),
        });
      } catch (e) {
        console.error("Falha ao chamar agente generate:", e);
      }

      // Notify user that generation started
      await supabase.from("notifications").insert({
        user_id: userId,
        titulo: "Trabalho em geração",
        corpo: `O teu trabalho sobre "${data.data.dados.tema}" foi registado e está a ser gerado. Vais ser notificado quando estiver pronto.`,
      });
    } else {
      // Notify admin for anexo mode
      await supabase.from("notifications").insert({
        user_id: userId,
        titulo: "Trabalho em análise",
        corpo: `O teu trabalho sobre "${data.data.dados.tema}" foi enviado para análise. Prazo até 6h.`,
      });
    }

    return { ok: true, trabalho_id: trabalho.id };
  });

export const listMyTrabalhos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: trabalhos, error } = await supabase
      .from("trabalhos")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return trabalhos || [];
  });

export const signAnexoUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      data: z.object({
        nome: z.string(),
        tamanho: z.number(),
      }),
    }),
  )
  .handler(async ({ data, context }) => {
    const path = `anexos/${context.userId}/${Date.now()}-${data.data.nome.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { signedUrl, error } = await supabaseAdmin.storage
      .from("trabalhos-anexos")
      .createSignedUploadUrl(path);

    if (error) throw new Error(error.message);
    return { path, token: signedUrl };
  });

export const signDownload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      data: z.object({
        path: z.string(),
      }),
    }),
  )
  .handler(async ({ data, context }) => {
    const { data: url, error } = await supabaseAdmin.storage
      .from("trabalhos-anexos")
      .createSignedUrl(data.data.path, 3600);

    if (error) throw new Error(error.message);
    return { url: url.signedUrl };
  });

// Admin functions
export const adminListTrabalhos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // Check if admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("telefone")
      .eq("id", userId)
      .single();

    if (profile?.telefone !== "861403004") {
      throw new Error("Não autorizado");
    }

    // List pending trabalhos
    const { data: trabalhos, error } = await supabase
      .from("trabalhos")
      .select("*")
      .eq("tipo_fonte", "anexo")
      .eq("status", "pendente_adm")
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    return trabalhos || [];
  });

export const adminSignUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      data: z.object({
        trabalhoId: z.string(),
        nome: z.string(),
      }),
    }),
  )
  .handler(async ({ data, context }) => {
    const path = `entregas/${data.data.trabalhoId}/${Date.now()}-${data.data.nome.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { signedUrl, error } = await supabaseAdmin.storage
      .from("trabalhos-anexos")
      .createSignedUploadUrl(path);

    if (error) throw new Error(error.message);
    return { path, token: signedUrl };
  });

export const adminEntregar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      data: z.object({
        trabalhoId: z.string(),
        ficheiro_url: z.string(),
      }),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    // Update trabalho status
    const { data: trabalho, error: selectError } = await supabase
      .from("trabalhos")
      .select("user_id, dados_formulario")
      .eq("id", data.data.trabalhoId)
      .single();

    if (selectError) throw new Error(selectError.message);

    const { error } = await supabase
      .from("trabalhos")
      .update({
        ficheiro_url: data.data.ficheiro_url,
        status: "entregue",
        entregue_em: new Date().toISOString(),
      })
      .eq("id", data.data.trabalhoId);

    if (error) throw new Error(error.message);

    // Notify user
    const tema = (trabalho.dados_formulario as any)?.tema ?? "trabalho";
    await supabase.from("notifications").insert({
      user_id: trabalho.user_id,
      titulo: "O teu trabalho está pronto!",
      corpo: `O teu trabalho "${tema}" já está disponível em Trabalhos.`,
    });

    return { ok: true };
  });

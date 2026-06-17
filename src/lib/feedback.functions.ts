import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ADMIN_PHONE = "861403004";

async function ensureAdmin(supabase: any, userId: string) {
  const { data } = await supabase.from("profiles").select("telefone").eq("id", userId).single();
  if (data?.telefone !== ADMIN_PHONE) throw new Error("Acesso restrito ao administrador.");
}

// ---- Avaliações ----
export const getMyAvaliacao = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("avaliacoes")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    return data;
  });

export const saveAvaliacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      estrelas: z.number().int().min(1).max(5),
      comentario: z.string().max(1000).default(""),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("avaliacoes")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (existing) {
      const { error } = await supabase
        .from("avaliacoes")
        .update({
          estrelas: data.estrelas,
          comentario: data.comentario,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("avaliacoes")
        .insert({ user_id: userId, estrelas: data.estrelas, comentario: data.comentario });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminListAvaliacoes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const { data, error } = await supabase
      .from("avaliacoes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ---- Contato com ADM ----
const CATEGORIAS = [
  "problema_tecnico",
  "sugestao",
  "duvida",
  "parceria",
  "denuncia",
  "outro",
] as const;

export const enviarContato = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      telefone: z.string().regex(/^\d{9,15}$/, "Telefone inválido"),
      categoria: z.enum(CATEGORIAS),
      motivo: z.string().min(3).max(200),
      mensagem: z.string().max(2000).default(""),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("contatos_admin").insert({
      user_id: userId,
      telefone: data.telefone,
      categoria: data.categoria,
      motivo: data.motivo,
      mensagem: data.mensagem,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListContatos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const { data, error } = await supabase
      .from("contatos_admin")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

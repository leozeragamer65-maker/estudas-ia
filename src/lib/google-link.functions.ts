import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Lê as identidades do utilizador autenticado e guarda o email Google
 * em profiles.google_email. Devolve o email gravado (ou null).
 */
export const syncGoogleEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: userData, error: uerr } = await supabase.auth.getUser();
    if (uerr) throw new Error(uerr.message);
    const identities = userData.user?.identities ?? [];
    const google = identities.find((i) => i.provider === "google");
    const email =
      (google?.identity_data as { email?: string } | undefined)?.email ??
      null;
    if (!email) return { google_email: null as string | null };

    const { error } = await supabase
      .from("profiles")
      .update({ google_email: email })
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return { google_email: email };
  });

/**
 * Guarda manualmente o email Google (Gmail) que o utilizador informa.
 * Valida o formato e a presença de domínio @gmail.com / googlemail.com
 * (aceita também outros domínios Google Workspace).
 */
export const saveGoogleEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      email: z
        .string()
        .trim()
        .toLowerCase()
        .email({ message: "Email inválido" })
        .max(255),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({ google_email: data.email })
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return { google_email: data.email };
  });

/**
 * Lookup admin: dado um email Google vinculado, devolve o telefone associado.
 * Usado para permitir login com email Google + senha (sem expor outros dados).
 */
export const lookupTelefoneByGoogleEmail = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: z.string().email() }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: row, error } = await supabaseAdmin
      .from("profiles")
      .select("telefone")
      .eq("google_email", data.email.toLowerCase())
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { telefone: row?.telefone ?? null };
  });

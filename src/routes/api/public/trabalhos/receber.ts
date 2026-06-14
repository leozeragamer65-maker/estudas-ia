import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Callback público chamado pelo agente externo quando o trabalho científico
// terminar de ser gerado. Recebe ficheiro em base64 (.docx) ou erro.
//
// Payload esperado:
// {
//   chat_id: string (= trabalho.id),
//   utilizador_id: string,
//   status: "pronto" | "erro",
//   ficheiro_base64?: string,
//   nome_ficheiro?: string,
//   mensagem_erro?: string
// }
//
// Query params:
//   telefone: numero do utilizador (usado para buscar user_id se não houver utilizador_id)

const BUCKET = "trabalhos-anexos";

function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/^data:.*;base64,/, "").replace(/\s+/g, "");
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function handler(request: Request) {
  const cors = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Bad JSON" }), {
      status: 400,
      headers: cors,
    });
  }

  await supabaseAdmin
    .from("webhook_logs")
    .insert({ provider: "trabalhos_callback", payload: body });

  const trabalhoId: string = body.chat_id ?? body.trabalho_id ?? "";
  let userId: string = body.utilizador_id ?? body.user_id ?? "";
  const status: string = body.status ?? "";

  // Extract telefone from query string if provided
  const url = new URL(request.url);
  const telefone = url.searchParams.get("telefone");

  // If no userId but telefone provided, look up user by telefone
  if (!userId && telefone) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("telefone", telefone)
      .maybeSingle();

    if (profile?.id) {
      userId = profile.id;
    }
  }

  if (!trabalhoId || !userId) {
    return new Response(
      JSON.stringify({ error: "chat_id e utilizador_id obrigatórios (ou telefone para lookup)" }),
      { status: 400, headers: cors },
    );
  }

  // Confirma que o trabalho pertence ao utilizador
  const { data: trabalho } = await supabaseAdmin
    .from("trabalhos")
    .select("id, user_id, titulo, dados_formulario")
    .eq("id", trabalhoId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!trabalho) {
    return new Response(
      JSON.stringify({ error: "Trabalho não encontrado" }),
      { status: 404, headers: cors },
    );
  }

  const tema =
    trabalho.titulo ??
    (trabalho.dados_formulario as any)?.tema ??
    "trabalho";

  if (status === "pronto") {
    const b64: string =
      body.ficheiro_base64 ?? body.file_base64 ?? body.docx_base64 ?? "";
    if (!b64) {
      return new Response(
        JSON.stringify({ error: "ficheiro_base64 em falta" }),
        { status: 400, headers: cors },
      );
    }

    const nomeBase =
      (body.nome_ficheiro as string | undefined)?.replace(
        /[^a-zA-Z0-9._-]/g,
        "_",
      ) ?? `${tema.slice(0, 40).replace(/[^a-zA-Z0-9._-]/g, "_")}.docx`;
    const path = `entregas/${trabalhoId}/${Date.now()}-${nomeBase}`;

    const bytes = base64ToBytes(b64);
    const { error: upErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, bytes, {
        contentType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        upsert: true,
      });
    if (upErr) {
      return new Response(
        JSON.stringify({ error: upErr.message }),
        { status: 500, headers: cors },
      );
    }

    await supabaseAdmin
      .from("trabalhos")
      .update({
        ficheiro_url: path,
        status: "entregue",
        entregue_em: new Date().toISOString(),
      })
      .eq("id", trabalhoId);

    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      titulo: "O teu trabalho está pronto!",
      corpo: `O teu trabalho "${tema}" já está disponível em Trabalhos.`,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: cors,
    });
  }

  if (status === "erro") {
    await supabaseAdmin
      .from("trabalhos")
      .update({ status: "erro" })
      .eq("id", trabalhoId);

    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      titulo: "Erro ao gerar o trabalho",
      corpo: `Erro ao gerar o trabalho "${tema}", tenta novamente.`,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: cors,
    });
  }

  return new Response(
    JSON.stringify({ error: "status inválido" }),
    { status: 400, headers: cors },
  );
}

export const Route = createFileRoute("/api/public/trabalhos/receber")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }),
      POST: async ({ request }) => handler(request),
    },
  },
});

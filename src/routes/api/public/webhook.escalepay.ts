import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Webhook EscalePay: confirma pagamentos e credita o plano/trabalho ao utilizador.
// URL pública: /api/public/webhook/escalepay
//
// Aceita formatos comuns de payload e mapeia o valor pago ao crédito:
//   75 MT  -> plano "75mt"  (válido 30 dias)
//   150 MT -> plano "150mt" (válido 30 dias)
//   50 MT  -> +1 trabalho científico disponível
//
// O utilizador é identificado pelo número de telefone (campo `telefone` em profiles).

export const Route = createFileRoute("/api/public/webhook/escalepay")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: any = {};
        try {
          body = await request.json();
        } catch {
          return new Response("Bad JSON", { status: 400 });
        }

        // Log sempre o payload bruto
        const { data: log } = await supabaseAdmin
          .from("webhook_logs")
          .insert({ provider: "escalepay", payload: body })
          .select("id")
          .single();

        try {
          // Normalizar campos comuns
          const status: string =
            body.status ?? body.transaction_status ?? body.payment_status ?? "";
          const telefoneRaw: string =
            body.telefone ?? body.phone ?? body.msisdn ?? body.customer_phone ?? "";
          const amount: number = Number(
            body.amount ?? body.valor ?? body.value ?? body.price ?? 0,
          );
          const reference: string =
            body.reference ?? body.id ?? body.transaction_id ?? body.txid ?? "";

          // Só processar pagamentos confirmados
          const ok = ["success", "successful", "paid", "approved", "completed", "ok"].includes(
            String(status).toLowerCase(),
          );
          if (!ok) {
            await supabaseAdmin
              .from("webhook_logs")
              .update({ processed: true, error: `Status não pago: ${status}` })
              .eq("id", log!.id);
            return new Response(JSON.stringify({ ok: true, ignored: true }), {
              status: 200,
              headers: { "content-type": "application/json" },
            });
          }

          if (!telefoneRaw) throw new Error("Telefone em falta no payload");

          // Normalizar telefone (apenas dígitos, últimos 9)
          const digits = telefoneRaw.replace(/\D/g, "");
          const tail = digits.slice(-9);

          // Procurar utilizador
          const { data: profiles, error: errProf } = await supabaseAdmin
            .from("profiles")
            .select("id, telefone, plano, trabalhos_disponiveis")
            .or(`telefone.eq.${telefoneRaw},telefone.eq.${digits},telefone.like.%${tail}`);
          if (errProf) throw new Error(errProf.message);
          const profile = profiles?.[0];
          if (!profile) throw new Error(`Utilizador não encontrado para ${telefoneRaw}`);

          // Decidir o que creditar
          let novoPlano: string | null = null;
          let novosTrabalhos = profile.trabalhos_disponiveis ?? 0;
          let titulo = "";
          let corpo = "";

          if (amount >= 150) {
            novoPlano = "150mt";
            titulo = "Plano 150 MT ativado";
            corpo = "Tens acesso ilimitado durante 30 dias. Bons estudos!";
          } else if (amount >= 75) {
            novoPlano = "75mt";
            titulo = "Plano 75 MT ativado";
            corpo = "Mais créditos diários durante 30 dias. Bons estudos!";
          } else if (amount >= 50) {
            novosTrabalhos += 1;
            titulo = "Trabalho científico disponível";
            corpo = "Já podes submeter o teu trabalho na secção Trabalhos.";
          } else {
            throw new Error(`Valor não reconhecido: ${amount}`);
          }

          const update: {
            trabalhos_disponiveis: number;
            plano?: string;
            plano_expira?: string;
          } = { trabalhos_disponiveis: novosTrabalhos };
          if (novoPlano) {
            update.plano = novoPlano;
            update.plano_expira = new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000,
            ).toISOString();
          }

          await supabaseAdmin.from("profiles").update(update).eq("id", profile.id);

          await supabaseAdmin.from("transactions").insert({
            user_id: profile.id,
            provider: "escalepay",
            product_id: novoPlano ?? "trabalho_50mt",
            amount,
            currency: "MZN",
            status: "paid",
            raw: body,
          });

          await supabaseAdmin.from("notifications").insert({
            user_id: profile.id,
            titulo,
            corpo,
          });

          await supabaseAdmin
            .from("webhook_logs")
            .update({ processed: true })
            .eq("id", log!.id);

          return new Response(
            JSON.stringify({ ok: true, reference, user_id: profile.id }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          await supabaseAdmin
            .from("webhook_logs")
            .update({ processed: false, error: msg })
            .eq("id", log!.id);
          return new Response(JSON.stringify({ ok: false, error: msg }), {
            status: 200, // devolve 200 para o EscalePay não retentar em loop
            headers: { "content-type": "application/json" },
          });
        }
      },

      GET: async () =>
        new Response(
          JSON.stringify({ ok: true, endpoint: "escalepay-webhook" }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
    },
  },
});

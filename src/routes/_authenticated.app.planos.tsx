import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getProfileWithUsage } from "@/lib/chat.functions";

export const Route = createFileRoute("/_authenticated/app/planos")({
  head: () => ({ meta: [{ title: "Planos — EstudaIA" }] }),
  component: PlanosPage,
});

const PLANOS = [
  {
    id: "free",
    nome: "Grátis",
    preco: "0 MT",
    items: ["3 perguntas/dia", "1 cálculo/dia"],
  },
  {
    id: "75mt",
    nome: "Estudante",
    preco: "75 MT/mês",
    items: ["50 perguntas/dia", "15 cálculos/dia", "Traduções e resumos"],
    destaque: true,
  },
  {
    id: "150mt",
    nome: "Pro",
    preco: "150 MT/mês",
    items: ["150 perguntas/dia", "50 cálculos/dia", "Apoio prioritário"],
  },
];

function PlanosPage() {
  const fetchProfile = useServerFn(getProfileWithUsage);
  const { data } = useQuery({ queryKey: ["profile-usage"], queryFn: () => fetchProfile() });
  const profile = data?.profile;

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-5xl px-5 py-8 md:px-10">
        <h1 className="font-display text-3xl">Planos</h1>
        <p className="mt-1 text-muted-foreground">
          O pagamento M-Pesa/Escalepay será activado em breve.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {PLANOS.map((pl) => (
            <div
              key={pl.id}
              className={`rounded-2xl border bg-card p-6 ${
                pl.destaque ? "border-primary ring-2 ring-primary/30" : "border-border"
              }`}
            >
              <div className="text-sm text-muted-foreground">{pl.nome}</div>
              <div className="mt-1 font-display text-3xl">{pl.preco}</div>
              <ul className="mt-4 space-y-2 text-sm">
                {pl.items.map((x) => (
                  <li key={x} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-primary" /> {x}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-5 w-full"
                disabled
                variant={pl.destaque ? "default" : "outline"}
              >
                {profile?.plano === pl.id ? "Plano actual" : "Em breve"}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-border bg-secondary p-4 text-sm">
          <strong>Trabalho científico avulso (50 MT):</strong> compra um e submete o
          pedido na secção "Trabalho Científico". Disponíveis:{" "}
          <strong>{profile?.trabalhos_disponiveis ?? 0}</strong>.
        </div>
      </div>
    </div>
  );
}

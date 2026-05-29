import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getProfileWithUsage } from "@/lib/chat.functions";

export const Route = createFileRoute("/_authenticated/conta")({
  head: () => ({ meta: [{ title: "Conta — EstudaIA" }] }),
  component: ContaPage,
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

function ContaPage() {
  const fetchProfile = useServerFn(getProfileWithUsage);
  const { data } = useQuery({ queryKey: ["profile-usage"], queryFn: () => fetchProfile() });
  const profile = data?.profile;
  const uso = data?.uso;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <Link to="/app" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <h1 className="mt-4 font-display text-4xl">A tua conta</h1>

        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <div className="text-sm text-muted-foreground">Olá,</div>
          <div className="font-display text-2xl">{profile?.nome || "Estudante"}</div>
          <div className="mt-1 text-sm text-muted-foreground">+{profile?.telefone}</div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
            Plano: {profile?.plano?.toUpperCase()}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <UsoCard label="Chat hoje" v={uso?.chat ?? 0} />
            <UsoCard label="Matemática" v={uso?.matematica ?? 0} />
            <UsoCard label="Traduções" v={uso?.traducao ?? 0} />
            <UsoCard label="Resumos" v={uso?.resumo ?? 0} />
          </div>
        </div>

        <h2 className="mt-10 font-display text-2xl">Planos</h2>
        <p className="text-sm text-muted-foreground">
          O pagamento M-Pesa/Escalepay será activado em breve. Por agora podes experimentar todas as
          funcionalidades no plano grátis.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
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
                {profile?.plano === pl.id ? "Plano atual" : "Em breve"}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-border bg-secondary p-4 text-sm">
          <strong>Trabalho científico avulso (50 MT):</strong> compra um e submete o pedido na
          secção "Trabalho Científico". Disponíveis:{" "}
          <strong>{profile?.trabalhos_disponiveis ?? 0}</strong>.
        </div>
      </div>
    </div>
  );
}

function UsoCard({ label, v }: { label: string; v: number }) {
  return (
    <div className="rounded-lg bg-secondary px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-display text-2xl">{v}</div>
    </div>
  );
}

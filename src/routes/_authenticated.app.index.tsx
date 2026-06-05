import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Calculator,
  MessageSquare,
  Presentation,
  Sparkles,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getProfileWithUsage } from "@/lib/chat.functions";
import { getDailyQuizzes } from "@/lib/quiz.functions";
import { QuizCard } from "@/components/QuizCard";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({ meta: [{ title: "Início — EstudaIA" }] }),
  component: DashboardPage,
});

const LIMITES_TOTAL: Record<string, number> = { free: 5, "75mt": 80, "150mt": 250 };

function DashboardPage() {
  const fetchProfile = useServerFn(getProfileWithUsage);
  const fetchQuizzes = useServerFn(getDailyQuizzes);
  const { data } = useQuery({ queryKey: ["profile-usage"], queryFn: () => fetchProfile() });
  const { data: quizzes = [] } = useQuery({ queryKey: ["daily-quizzes"], queryFn: () => fetchQuizzes() });
  const profile = data?.profile;
  const uso = data?.uso;
  const plano = profile?.plano ?? "free";
  const total = LIMITES_TOTAL[plano] ?? 5;
  const usadosHoje = (uso?.chat ?? 0) + (uso?.matematica ?? 0) + (uso?.traducao ?? 0) + (uso?.resumo ?? 0);
  const restantes = Math.max(0, total - usadosHoje);
  const pct = total > 0 ? Math.round((usadosHoje / total) * 100) : 0;

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl md:text-4xl">
              Olá, {profile?.nome || "Estudante"} <span className="inline-block">👋</span>
            </h1>
            <p className="mt-1 text-muted-foreground">
              Pronto para um dia produtivo de estudo?
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground">
            Plano {plano === "free" ? "Grátis" : plano.toUpperCase()}
          </span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Créditos disponíveis</div>
              <div className="font-display text-3xl">
                {restantes}
                <span className="text-base text-muted-foreground"> / {total}</span>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-foreground"
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {usadosHoje} créditos usados hoje
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Trabalhos disponíveis</div>
              <div className="font-display text-3xl">
                {profile?.trabalhos_disponiveis ?? 0}
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Acompanha o estado em "Trabalho Científico".
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl bg-sidebar p-5 text-sidebar-foreground md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="font-display text-xl">Desbloqueia todo o potencial</div>
                <div className="text-sm text-sidebar-foreground/70">
                  Mais créditos, apresentações PPT, tradutor e muito mais.
                </div>
              </div>
            </div>
            <Button asChild>
              <Link to="/app/planos">
                Ver planos <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <h2 className="mt-10 font-display text-2xl">Acesso rápido</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickCard
            to="/app/trabalhos"
            icon={FileText}
            title="Trabalho Científico"
            desc="Pedido entregue pelo nosso time"
          />
          <QuickCard
            to="/app/matematica"
            icon={Calculator}
            title="Matemática"
            desc="Resolução passo a passo"
          />
          <QuickCard
            to="/app/chat"
            icon={MessageSquare}
            title="Chat IA"
            desc="Tira dúvidas 24/7"
          />
          <QuickCard
            to="/app/apresentacoes"
            icon={Presentation}
            title="Apresentações"
            desc="Slides PPT em segundos"
          />
        </div>
      </div>
    </div>
  );
}

function QuickCard({
  to,
  icon: Icon,
  title,
  desc,
}: {
  to: "/app/trabalhos" | "/app/matematica" | "/app/chat" | "/app/apresentacoes";
  icon: typeof FileText;
  title: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar text-sidebar-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3 font-display text-lg">{title}</div>
      <div className="text-sm text-muted-foreground">{desc}</div>
    </Link>
  );
}

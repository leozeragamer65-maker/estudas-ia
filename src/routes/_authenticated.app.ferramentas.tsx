import { createFileRoute, Link } from "@tanstack/react-router";
import { Languages, FileText, Wrench, Quote } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/ferramentas")({
  head: () => ({ meta: [{ title: "Ferramentas — EstudaIA" }] }),
  component: FerramentasPage,
});

const TOOLS = [
  {
    icon: Languages,
    title: "Tradutor",
    desc: "Traduz textos entre português, inglês e outras línguas. Cada tradução fica no seu próprio histórico.",
    to: "/app/tradutor" as const,
  },
  {
    icon: FileText,
    title: "Resumir texto",
    desc: "Cola um texto longo e recebe um resumo claro, com histórico separado por sessão.",
    to: "/app/resumo" as const,
  },
  {
    icon: Wrench,
    title: "Corrector de português",
    desc: "Melhora ortografia, gramática e estilo de qualquer texto.",
    to: "/app/corretor" as const,
  },
  {
    icon: Quote,
    title: "Citações",
    desc: "Gera citações e referências (APA, ABNT, Harvard) automaticamente.",
    soon: true as const,
  },
];

function FerramentasPage() {
  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-5xl px-5 py-8 md:px-10">
        <h1 className="font-display text-3xl">Ferramentas</h1>
        <p className="mt-1 text-muted-foreground">
          Cada ferramenta tem o seu próprio agente e histórico de conversas separado.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            const soon = "soon" in t && t.soon;
            const card = (
              <div
                className={`rounded-2xl border border-border bg-card p-5 transition-colors h-full ${
                  soon ? "opacity-70" : "hover:border-primary/40 hover:bg-card/80 cursor-pointer"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar text-sidebar-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="font-display text-lg">{t.title}</span>
                  {soon && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                      Em breve
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
              </div>
            );
            return soon ? (
              <div key={t.title}>{card}</div>
            ) : (
              <Link key={t.title} to={t.to!} className="block">
                {card}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

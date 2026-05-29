import { createFileRoute, Link } from "@tanstack/react-router";
import { Languages, FileText, Wrench } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/ferramentas")({
  head: () => ({ meta: [{ title: "Ferramentas — EstudaIA" }] }),
  component: FerramentasPage,
});

const TOOLS = [
  {
    icon: Languages,
    title: "Tradutor",
    desc: "Traduz textos entre português, inglês e outras línguas.",
    soon: true,
  },
  {
    icon: FileText,
    title: "Resumir texto",
    desc: "Cola um texto longo e recebe um resumo claro.",
    soon: true,
  },
  {
    icon: Wrench,
    title: "Corrector de português",
    desc: "Melhora ortografia e gramática de qualquer texto.",
    soon: true,
  },
];

function FerramentasPage() {
  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-5xl px-5 py-8 md:px-10">
        <h1 className="font-display text-3xl">Ferramentas</h1>
        <p className="mt-1 text-muted-foreground">
          Pequenos utilitários para o teu dia-a-dia académico.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map(({ icon: Icon, title, desc, soon }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar text-sidebar-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="font-display text-lg">{title}</span>
                {soon && (
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                    Em breve
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Entretanto podes usar o{" "}
          <Link to="/app/chat" className="text-primary underline">
            Chat IA
          </Link>{" "}
          para traduções e resumos.
        </p>
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Presentation, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/app/apresentacoes")({
  head: () => ({ meta: [{ title: "Apresentações — EstudaIA" }] }),
  component: ApresentacoesPage,
});

function ApresentacoesPage() {
  return (
    <div className="flex h-full items-center justify-center bg-background p-6">
      <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-sidebar text-sidebar-foreground">
          <Presentation className="h-7 w-7" />
        </div>
        <h2 className="mt-4 font-display text-2xl">Apresentações</h2>
        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Lock className="h-3 w-3" /> Disponível no Plano Pro
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Após obteres o <strong>Plano Pro</strong> poderás gerar apresentações PPT a partir de um
          tema, com slides já estruturados e prontos a apresentar.
        </p>
        <Button asChild className="mt-5">
          <Link to="/app/planos">Ver Plano Pro</Link>
        </Button>
      </div>
    </div>
  );
}

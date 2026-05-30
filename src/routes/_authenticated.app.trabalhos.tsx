import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/app/trabalhos")({
  head: () => ({ meta: [{ title: "Trabalho científico — EstudaIA" }] }),
  component: TrabalhosPage,
});

function TrabalhosPage() {
  return (
    <div className="flex h-full items-center justify-center bg-background p-6">
      <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-sidebar text-sidebar-foreground">
          <FileText className="h-7 w-7" />
        </div>
        <h2 className="mt-4 font-display text-2xl">Trabalho científico</h2>
        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Clock className="h-3 w-3" /> Em breve
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          A submissão automática de trabalhos científicos vai estar disponível
          em breve. Por enquanto, podes adquirir o pacote avulso na página de
          planos — entraremos em contacto pelo WhatsApp para receber o teu
          questionário.
        </p>
        <Button asChild className="mt-5">
          <Link to="/app/planos">Ver planos</Link>
        </Button>
      </div>
    </div>
  );
}

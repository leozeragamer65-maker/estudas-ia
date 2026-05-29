import { createFileRoute, Link } from "@tanstack/react-router";
import { Presentation } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/app/apresentacoes")({
  head: () => ({ meta: [{ title: "Apresentações — EstudaIA" }] }),
  component: () => (
    <ComingSoon
      icon={<Presentation className="h-7 w-7" />}
      title="Apresentações"
      desc="Em breve poderás gerar apresentações PPT a partir de um tema, com slides já estruturados."
    />
  ),
});

function ComingSoon({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex h-full items-center justify-center bg-background p-6">
      <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-sidebar text-sidebar-foreground">
          {icon}
        </div>
        <h2 className="mt-4 font-display text-2xl">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
        <Button asChild className="mt-5">
          <Link to="/app/planos">Ver planos</Link>
        </Button>
      </div>
    </div>
  );
}

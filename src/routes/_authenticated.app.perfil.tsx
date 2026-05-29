import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getProfileWithUsage } from "@/lib/chat.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/app/perfil")({
  head: () => ({ meta: [{ title: "Perfil — EstudaIA" }] }),
  component: PerfilPage,
});

function PerfilPage() {
  const fetchProfile = useServerFn(getProfileWithUsage);
  const { data } = useQuery({ queryKey: ["profile-usage"], queryFn: () => fetchProfile() });
  const profile = data?.profile;
  const uso = data?.uso;
  const navigate = useNavigate();

  const sair = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-3xl px-5 py-8 md:px-10">
        <h1 className="font-display text-3xl">Perfil</h1>

        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <div className="text-sm text-muted-foreground">Nome</div>
          <div className="font-display text-2xl">{profile?.nome || "Estudante"}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            +{profile?.telefone}
          </div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
            Plano: {(profile?.plano ?? "free").toUpperCase()}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Box label="Chat hoje" v={uso?.chat ?? 0} />
            <Box label="Matemática" v={uso?.matematica ?? 0} />
            <Box label="Traduções" v={uso?.traducao ?? 0} />
            <Box label="Resumos" v={uso?.resumo ?? 0} />
          </div>
        </div>

        <Button variant="outline" className="mt-6" onClick={sair}>
          <LogOut className="mr-2 h-4 w-4" /> Terminar sessão
        </Button>
      </div>
    </div>
  );
}

function Box({ label, v }: { label: string; v: number }) {
  return (
    <div className="rounded-lg bg-secondary px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-display text-2xl">{v}</div>
    </div>
  );
}

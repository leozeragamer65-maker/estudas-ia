import { Link, useNavigate } from "@tanstack/react-router";
import {
  Home,
  FileText,
  Calculator,
  MessageSquare,
  Presentation,
  Wrench,
  CreditCard,
  User,
  LogOut,
  GraduationCap,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const ITEMS = [
  { to: "/app", label: "Início", icon: Home, exact: true },
  { to: "/app/trabalhos", label: "Trabalho Científico", icon: FileText },
  { to: "/app/matematica", label: "Matemática", icon: Calculator },
  { to: "/app/chat", label: "Chat IA", icon: MessageSquare },
  { to: "/app/apresentacoes", label: "Apresentações", icon: Presentation },
  { to: "/app/ferramentas", label: "Ferramentas", icon: Wrench },
  { to: "/app/planos", label: "Planos", icon: CreditCard },
  { to: "/app/perfil", label: "Perfil", icon: User },
] as const;

interface Props {
  plano?: string | null;
  onNavigate?: () => void;
}

export function AppSidebar({ plano, onNavigate }: Props) {
  const navigate = useNavigate();

  const sair = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <GraduationCap className="h-5 w-5" />
        </div>
        <span className="font-display text-2xl">EstudaIA</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {ITEMS.map(({ to, label, icon: Icon, exact }) => (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            activeOptions={{ exact: !!exact }}
            className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeProps={{
              className:
                "mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm bg-sidebar-accent text-sidebar-accent-foreground",
            }}
          >
            <Icon className="h-4 w-4" /> {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 rounded-lg bg-sidebar-accent/50 px-3 py-2">
          <div className="text-xs text-sidebar-foreground/60">Plano actual</div>
          <div className="mt-0.5">
            <span className="inline-flex rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {(plano ?? "free").toUpperCase()}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={sair}
        >
          <LogOut className="mr-2 h-4 w-4" /> Sair
        </Button>
      </div>
    </aside>
  );
}

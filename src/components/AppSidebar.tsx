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
  ShieldCheck,
  Sun,
  Moon,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

import { useState, useEffect } from "react";

const ITEMS: Array<{ to: string; label: string; icon: typeof Home; exact?: boolean }> = [
  { to: "/app", label: "Início", icon: Home, exact: true },
  { to: "/app/trabalhos", label: "Trabalho Científico", icon: FileText },
  { to: "/app/matematica", label: "Matemática", icon: Calculator },
  { to: "/app/chat", label: "Chat IA", icon: MessageSquare },
  { to: "/app/apresentacoes", label: "Apresentações", icon: Presentation },
  { to: "/app/ferramentas", label: "Ferramentas", icon: Wrench },
  { to: "/app/planos", label: "Planos", icon: CreditCard },
  { to: "/app/perfil", label: "Perfil", icon: User },
];

interface Props {
  plano?: string | null;
  isAdmin?: boolean;
  onNavigate?: () => void;
}

export function AppSidebar({ plano, isAdmin, onNavigate }: Props) {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isFree, setIsFree] = useState(true);

  const items = isAdmin
    ? [...ITEMS, { to: "/app/admin", label: "Painel ADM", icon: ShieldCheck }]
    : ITEMS;

  // Theme management
  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    };
    checkTheme();

    window.addEventListener("theme-change", checkTheme);
    window.addEventListener("storage", checkTheme);

    return () => {
      window.removeEventListener("theme-change", checkTheme);
      window.removeEventListener("storage", checkTheme);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    window.dispatchEvent(new Event("theme-change"));
  };

  // Check if free user
  useEffect(() => {
    setIsFree(!plano || plano.toLowerCase() === "free");
  }, [plano]);

  const sair = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <aside className="flex h-full w-72 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <GraduationCap className="h-5 w-5" />
        </div>
        <span className="font-display text-2xl tracking-tight">Estuda IA</span>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {items.map(({ to, label, icon: Icon, exact }) => (
          <Link
            key={to}
            to={to as "/app"}
            onClick={onNavigate}
            activeOptions={{ exact: !!exact }}
            className="group flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm transition-all text-sidebar-foreground/85 hover:text-sidebar-foreground hover:bg-sidebar-accent active:bg-sidebar-accent/50"
            activeProps={{
              className:
                "bg-sidebar-accent text-primary font-medium border-l-2 border-primary pl-[14px]",
            }}
          >
            <Icon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Upgrade Banner - only for free users */}
      {isFree && (
        <div className="mx-4 mb-4 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div className="text-sm">
              <div className="font-medium text-primary">Seja ainda melhor.</div>
              <div className="text-sidebar-foreground/75 mt-1 leading-snug">
                Explore todos os recursos e potencialize seus estudos!
              </div>
              <Link
                to="/app/planos"
                onClick={onNavigate}
                className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline"
              >
                Explorar mais <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4 space-y-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex w-full items-center justify-between rounded-xl bg-sidebar-accent px-4 py-3 text-sm hover:bg-sidebar-accent/80 transition-colors text-sidebar-foreground"
        >
          <div className="flex items-center gap-3">
            {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            Modo {theme === "dark" ? "Escuro" : "Claro"}
          </div>
          <div
            className={`h-5 w-9 rounded-full relative transition-colors ${theme === "dark" ? "bg-primary" : "bg-sidebar-foreground/20"}`}
          >
            <div
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-sidebar transition-all ${theme === "dark" ? "left-0.5" : "left-4"}`}
            />
          </div>
        </button>

        {/* Logout */}
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          onClick={sair}
        >
          <LogOut className="mr-2 h-4 w-4" /> Sair
        </Button>
      </div>
    </aside>
  );
}

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
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isFree, setIsFree] = useState(true);

  const items = isAdmin
    ? [...ITEMS, { to: "/app/admin", label: "Painel ADM", icon: ShieldCheck }]
    : ITEMS;

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  // Check if free user
  useEffect(() => {
    setIsFree(!plano || plano.toLowerCase() === 'free');
  }, [plano]);

  const sair = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <aside className="flex h-full w-72 flex-col bg-[#0f0f0f] text-white border-r border-white/10">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F97316] text-black">
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
            className="group flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm transition-all hover:bg-white/5 active:bg-white/10"
            activeProps={{
              className: "bg-[#F97316]/10 text-[#F97316] font-medium border-l-2 border-[#F97316]",
            }}
          >
            <Icon className="h-5 w-5 text-[#F97316] group-hover:scale-110 transition-transform" /> 
            {label}
          </Link>
        ))}
      </nav>

      {/* Upgrade Banner - only for free users */}
      {isFree && (
        <div className="mx-4 mb-4 rounded-2xl bg-gradient-to-br from-[#F97316]/10 to-transparent border border-[#F97316]/20 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F97316]/10">
              <GraduationCap className="h-5 w-5 text-[#F97316]" />
            </div>
            <div className="text-sm">
              <div className="font-medium text-[#F97316]">Seja ainda melhor.</div>
              <div className="text-white/70 mt-1 leading-snug">
                Explore todos os recursos e potencialize seus estudos!
              </div>
              <Link 
                to="/app/planos" 
                onClick={onNavigate}
                className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-[#F97316] hover:underline"
              >
                Explorar mais <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-white/10 p-4 space-y-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex w-full items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-sm hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            Modo {theme === 'dark' ? 'Escuro' : 'Claro'}
          </div>
          <div className={`h-5 w-9 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-[#F97316]' : 'bg-white/30'}`}>
            <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${theme === 'dark' ? 'left-0.5' : 'left-4'}`} />
          </div>
        </button>

        {/* Logout */}
        <Button
          variant="ghost"
          className="w-full justify-start text-white/70 hover:bg-white/10 hover:text-white"
          onClick={sair}
        >
          <LogOut className="mr-2 h-4 w-4" /> Sair
        </Button>
      </div>
    </aside>
  );
}

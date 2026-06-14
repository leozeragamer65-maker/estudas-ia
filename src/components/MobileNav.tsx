import { useState } from "react";
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
  Menu,
  X,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

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

export function MobileNav({ plano, isAdmin, onNavigate }: Props) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const items = isAdmin
    ? [...ITEMS, { to: "/app/admin", label: "Painel ADM", icon: ShieldCheck }]
    : ITEMS;

  const isFree = !plano || plano.toLowerCase() === 'free';

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleNavClick = () => {
    setIsOpen(false);
    onNavigate?.();
  };

  const sair = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="md:hidden">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-40 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <Menu className="h-6 w-6 text-white" />
        )}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Menu Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-gradient-to-b from-[#0f0f0f] to-[#1a1a1a] border-l border-white/10 z-40 transform transition-transform duration-300 ease-out overflow-y-auto ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center gap-3 px-6 py-6 border-b border-white/10 bg-[#0f0f0f]">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F97316] text-black">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-display text-xl tracking-tight text-white">Estuda IA</span>
        </div>

        {/* Menu Items */}
        <nav className="px-4 py-6 space-y-3">
          {items.map(({ to, label, icon: Icon, exact }) => (
            <Link
              key={to}
              to={to as "/app"}
              onClick={handleNavClick}
              activeOptions={{ exact: !!exact }}
              className="group flex items-center gap-4 rounded-2xl px-6 py-4 text-base transition-all hover:bg-white/5 active:bg-white/10 text-white/80 hover:text-white"
              activeProps={{
                className: "bg-[#F97316]/15 text-[#F97316] font-medium border-l-4 border-[#F97316] pl-5",
              }}
            >
              <Icon className="h-6 w-6 text-[#F97316]" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Upgrade Banner - only for free users */}
        {isFree && (
          <div className="mx-4 my-6 rounded-2xl bg-gradient-to-br from-[#F97316]/20 to-[#F97316]/5 border border-[#F97316]/30 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F97316]/20">
                <GraduationCap className="h-5 w-5 text-[#F97316]" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-[#F97316] text-sm">Seja ainda melhor.</div>
                <div className="text-white/70 mt-2 text-xs leading-relaxed">
                  Explore todos os recursos e potencialize seus estudos!
                </div>
                <Link
                  to="/app/planos"
                  onClick={handleNavClick}
                  className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[#F97316] hover:text-[#FF9E3E] transition-colors"
                >
                  Explorar mais <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-white/10 p-4 space-y-3 mt-auto bg-[#0f0f0f]">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex w-full items-center justify-between rounded-xl bg-white/10 hover:bg-white/20 px-4 py-3 text-sm transition-colors text-white/80 hover:text-white"
          >
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="h-5 w-5 text-[#F97316]" />
              ) : (
                <Sun className="h-5 w-5 text-[#F97316]" />
              )}
              <span>Modo {theme === 'dark' ? 'Escuro' : 'Claro'}</span>
            </div>
            <div
              className={`h-5 w-9 rounded-full relative transition-colors ${
                theme === 'dark' ? 'bg-[#F97316]' : 'bg-white/30'
              }`}
            >
              <div
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                  theme === 'dark' ? 'left-0.5' : 'left-4'
                }`}
              />
            </div>
          </button>

          {/* Logout */}
          <Button
            variant="ghost"
            className="w-full justify-start text-white/70 hover:bg-white/10 hover:text-white"
            onClick={sair}
          >
            <LogOut className="mr-3 h-5 w-5" /> Sair
          </Button>
        </div>
      </div>
    </div>
  );
}

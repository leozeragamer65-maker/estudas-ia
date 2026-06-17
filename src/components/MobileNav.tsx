import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "@tanstack/react-router";
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
  ChevronRight,
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
  const location = useLocation();
  const currentPath = location.pathname;
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const items = isAdmin
    ? [...ITEMS, { to: "/app/admin", label: "Painel ADM", icon: ShieldCheck }]
    : ITEMS;

  const isFree = !plano || plano.toLowerCase() === "free";

  // Sync local state with document theme
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
      {/* Hamburger / Menu Button (Floating Trigger) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-40 p-2.5 rounded-xl bg-card border border-border hover:bg-muted active:scale-95 transition-all shadow-lg backdrop-blur-md"
      >
        <Menu className="h-5 w-5 text-foreground" />
      </button>

      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fadein"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out Drawer Panel (Slides in from LEFT as per design positioning) */}
      <div
        className={`fixed top-0 left-0 h-full w-[310px] bg-sidebar border-r border-sidebar-border z-50 transform transition-transform duration-300 ease-out overflow-y-auto flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 border border-primary/30 text-primary shadow-[0_0_10px_rgba(255,107,0,0.2)]">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-sans text-[20px] font-bold tracking-tight text-sidebar-foreground">
              Estuda IA
            </span>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center h-10 w-10 rounded-[14px] border border-sidebar-border hover:border-sidebar-foreground/25 hover:bg-sidebar-accent transition-all text-sidebar-foreground/80 active:scale-95"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        {/* Menu Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-2.5">
          {items.map(({ to, label, icon: Icon, exact }) => {
            const isActive = exact
              ? currentPath === to
              : currentPath === to || (to !== "/app" && currentPath.startsWith(to));

            return (
              <Link
                key={to}
                to={to as "/app"}
                onClick={handleNavClick}
                className={`relative group flex items-center justify-between rounded-[14px] px-5 py-4 border transition-all duration-300 ${
                  isActive
                    ? "bg-sidebar-accent border-primary/40 text-sidebar-foreground shadow-[0_0_15px_-3px_rgba(255,107,0,0.25)] ring-1 ring-primary/30"
                    : "bg-sidebar-accent/10 border-sidebar-border text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                {/* Active left indicator line */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[28px] bg-primary rounded-r-full shadow-[0_0_8px_rgba(255,107,0,0.8)]" />
                )}

                <div className="flex items-center gap-4">
                  <Icon
                    className={`h-[22px] w-[22px] transition-transform duration-300 group-hover:scale-110 ${
                      isActive
                        ? "text-primary"
                        : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
                    }`}
                  />
                  <span className="font-sans text-[15px] font-medium leading-none">{label}</span>
                </div>

                <ChevronRight
                  className={`h-4 w-4 transition-transform duration-300 ${
                    isActive
                      ? "text-primary"
                      : "text-sidebar-foreground/20 group-hover:text-sidebar-foreground"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        {/* Upgrade Banner - ONLY available to free users */}
        {isFree && (
          <Link
            to="/app/planos"
            onClick={handleNavClick}
            className="mx-4 mb-6 block rounded-2xl bg-gradient-to-br from-primary/12 to-transparent border border-primary/15 p-5 hover:border-primary/30 transition-all duration-300 relative group"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary shadow-[0_0_8px_rgba(255,107,0,0.15)]">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-sans font-bold text-sidebar-foreground text-[14px]">
                  Seja ainda melhor.
                </div>
                <div className="text-sidebar-foreground/60 mt-1 text-xs leading-normal">
                  Explore todos os recursos e potencialize seus estudos!
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-primary/85 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        )}

        {/* Footer (Theme Toggle + Sair button) */}
        <div className="border-t border-sidebar-border p-4 bg-sidebar space-y-1">
          {/* Theme Switch Toggle */}
          <button
            onClick={toggleTheme}
            className="flex w-full items-center justify-between rounded-xl hover:bg-sidebar-accent px-4 py-3 text-sm transition-all text-sidebar-foreground/80 hover:text-sidebar-foreground"
          >
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon className="h-5 w-5 text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-primary" />
              )}
              <span className="font-sans font-medium text-[15px]">Modo escuro</span>
            </div>
            <div
              className={`h-6 w-11 rounded-full relative transition-colors duration-300 ${
                theme === "dark"
                  ? "bg-primary shadow-[0_0_8px_rgba(255,107,0,0.4)]"
                  : "bg-sidebar-foreground/25"
              }`}
            >
              <div
                className={`absolute top-1 h-4 w-4 rounded-full bg-sidebar transition-all duration-300 ${
                  theme === "dark" ? "left-6" : "left-1"
                }`}
              />
            </div>
          </button>

          {/* Sign Out Button */}
          <button
            onClick={sair}
            className="flex w-full items-center gap-3 rounded-xl hover:bg-sidebar-accent px-4 py-3 text-sm text-red-500 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-[18px] w-[18px]" />
            <span className="font-sans font-medium">Sair da conta</span>
          </button>
        </div>
      </div>
    </div>
  );
}

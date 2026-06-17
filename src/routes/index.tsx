import { createFileRoute, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Menu,
  User,
  BookOpen,
  FlaskConical,
  CalendarCheck,
  MessageCircle,
  Send,
  GraduationCap,
  Home,
  FileText,
  Calculator,
  MessageSquare,
  Presentation,
  Wrench,
  CreditCard,
  X,
  ChevronRight,
  Moon,
  Sun,
  LogOut,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EstudaIA — O que vamos estudar hoje?" },
      {
        name: "description",
        content:
          "Pergunte qualquer coisa sobre os seus estudos e aprenda com a IA. Resumos, exercícios e questões diárias em português de Moçambique.",
      },
      { property: "og:title", content: "EstudaIA — O que vamos estudar hoje?" },
      {
        property: "og:description",
        content: "Pergunte qualquer coisa sobre os seus estudos e aprenda com a IA.",
      },
    ],
  }),
  component: Landing,
});

const MENU_ITEMS = [
  { to: "/app", label: "Início", icon: Home },
  { to: "/app/trabalhos", label: "Trabalho Científico", icon: FileText },
  { to: "/app/matematica", label: "Matemática", icon: Calculator },
  { to: "/app/chat", label: "Chat IA", icon: MessageSquare },
  { to: "/app/apresentacoes", label: "Apresentações", icon: Presentation },
  { to: "/app/ferramentas", label: "Ferramentas", icon: Wrench },
  { to: "/app/planos", label: "Planos", icon: CreditCard },
  { to: "/app/perfil", label: "Perfil", icon: User },
] as const;

function Landing() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const [menuOpen, setMenuOpen] = useState(false);
  const [pergunta, setPergunta] = useState("");
  const [autenticado, setAutenticado] = useState<boolean | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Sync theme
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAutenticado(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAutenticado(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const texto = pergunta.trim();
    if (!texto) return;
    if (autenticado) {
      sessionStorage.setItem("estudaia:pergunta-inicial", texto);
      navigate({ to: "/app/chat" });
    } else {
      sessionStorage.setItem("estudaia:pergunta-inicial", texto);
      navigate({ to: "/login" });
    }
  };

  const irPerfil = () => {
    navigate({ to: autenticado ? "/app/perfil" : "/login" });
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#0f0f0f] text-white">
      {/* Onda decorativa */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[42vh] overflow-hidden">
        <svg
          viewBox="0 0 1024 600"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <linearGradient id="wave1" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#1a0d05" />
              <stop offset="100%" stopColor="#0f0f0f" />
            </linearGradient>
            <linearGradient id="wave2" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#7a3a10" stopOpacity="0.0" />
              <stop offset="50%" stopColor="#F97316" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#7a3a10" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="1024" height="600" fill="url(#wave1)" />
          <path
            d="M0 320 C 220 240, 420 420, 640 340 S 980 280, 1024 320 L 1024 600 L 0 600 Z"
            fill="#0f0f0f"
          />
          <path
            d="M0 320 C 220 240, 420 420, 640 340 S 980 280, 1024 320"
            fill="none"
            stroke="url(#wave2)"
            strokeWidth="2.5"
          />
        </svg>
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-5 pt-5">
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menu"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/5"
        >
          <Menu className="h-6 w-6" />
        </button>
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F97316]/15 text-[#F97316]">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-semibold">Estuda IA</span>
        </Link>
        <button
          onClick={irPerfil}
          aria-label="Perfil"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/90 transition-colors hover:bg-white/10"
        >
          <User className="h-5 w-5" />
        </button>
      </header>

      {/* Conteúdo */}
      <main className="relative z-10 flex flex-1 flex-col px-6 pb-32 pt-16">
        <div className="mx-auto w-full max-w-md flex-1">
          <h1
            className="font-display text-[42px] font-bold leading-[1.05] tracking-tight md:text-5xl"
            style={{ animation: "estudaia-rise 0.6s ease-out both" }}
          >
            O que vamos
            <br />
            estudar <span className="text-[#F97316]">hoje?</span>
          </h1>
          <p
            className="mt-5 text-base text-white/55 md:text-lg"
            style={{ animation: "estudaia-rise 0.7s 0.1s ease-out both" }}
          >
            Pergunte qualquer coisa sobre seus estudos e aprenda com a IA.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-3">
            <FeatureCard
              icon={BookOpen}
              title="Resumos"
              desc="Entenda os principais temas"
              color="#F97316"
              delay={0.15}
            />
            <FeatureCard
              icon={FlaskConical}
              title="Exercícios"
              desc="Pratique e fixe o conteúdo"
              color="#A78BFA"
              delay={0.25}
            />
            <FeatureCard
              icon={CalendarCheck}
              title="Questões diárias"
              desc="Desafios novos todos os dias"
              color="#4ADE80"
              delay={0.35}
            />
          </div>
        </div>
      </main>

      {/* Barra de chat fixa */}
      <form
        onSubmit={enviar}
        className="fixed inset-x-0 bottom-0 z-20 border-t border-white/5 bg-[#0f0f0f]/90 px-4 pb-5 pt-3 backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-md items-center gap-2 rounded-2xl border border-[#F97316]/60 bg-[#15100b] px-3 py-2 shadow-[0_0_24px_-8px_rgba(249,115,22,0.45)]">
          <MessageCircle className="ml-1 h-5 w-5 shrink-0 text-[#F97316]" />
          <input
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            placeholder="Pergunte ao Estuda IA…"
            className="flex-1 bg-transparent py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Enviar"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F97316] text-white shadow-lg transition-transform active:scale-95 disabled:opacity-50"
            disabled={!pergunta.trim()}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>

      {/* Sidebar Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fadein"
            onClick={() => setMenuOpen(false)}
          />
          <aside
            className="relative flex h-full w-[310px] max-w-[85vw] flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-[5px_0_25px_rgba(0,0,0,0.4)] overflow-y-auto"
            style={{ animation: "estudaia-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both" }}
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
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center h-10 w-10 bg-transparent rounded-[14px] border border-sidebar-border hover:border-sidebar-foreground/25 hover:bg-sidebar-accent transition-all text-sidebar-foreground/80 active:scale-95"
                aria-label="Fechar menu"
              >
                <X className="h-[18px] w-[18px]" />
              </button>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 px-4 py-6 space-y-2.5 overflow-y-auto">
              {MENU_ITEMS.map(({ to, label, icon: Icon }) => {
                const isActive = currentPath === to;
                return (
                  <Link
                    key={to}
                    to={to as "/app"}
                    onClick={() => setMenuOpen(false)}
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
                            : "text-primary group-hover:text-sidebar-foreground"
                        }`}
                      />
                      <span className="font-sans text-[15px] font-medium leading-none">
                        {label}
                      </span>
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

            {/* Upgrade Banner - ONLY available for free users */}
            <Link
              to="/app/planos"
              onClick={() => setMenuOpen(false)}
              className="mx-4 mb-3 block rounded-2xl bg-gradient-to-br from-primary/12 to-transparent border border-primary/15 p-5 hover:border-primary/30 transition-all duration-300 relative group"
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

            {/* Footer with Login-Action / Logout + Dark mode switch */}
            <div className="border-t border-sidebar-border p-4 bg-sidebar space-y-1 mt-auto">
              {/* Theme Switch Toggle */}
              <button
                onClick={toggleTheme}
                type="button"
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

              {autenticado ? (
                <button
                  type="button"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setMenuOpen(false);
                    navigate({ to: "/login" });
                  }}
                  className="flex w-full items-center gap-3 rounded-xl hover:bg-sidebar-accent px-4 py-3 text-sm text-red-500 hover:text-red-400 transition-colors"
                >
                  <LogOut className="h-[18px] w-[18px]" />
                  <span className="font-sans font-medium">Sair da conta</span>
                </button>
              ) : (
                <div className="pt-2 px-1">
                  <Button
                    className="w-full bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl font-medium py-5 shadow-lg shadow-primary/20"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate({ to: "/login" });
                    }}
                  >
                    Entrar
                  </Button>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      <style>{`
        @keyframes estudaia-rise {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes estudaia-slide-in {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
  color,
  delay,
}: {
  icon: typeof BookOpen;
  title: string;
  desc: string;
  color: string;
  delay: number;
}) {
  return (
    <div
      className="rounded-2xl border bg-[#141414] p-3.5 transition-transform hover:-translate-y-0.5"
      style={{
        borderColor: `${color}55`,
        animation: `estudaia-rise 0.6s ${delay}s ease-out both`,
        boxShadow: `inset 0 0 0 1px ${color}10`,
      }}
    >
      <span
        className="flex h-9 w-9 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}1a`, color }}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="mt-3 text-sm font-semibold text-white">{title}</div>
      <div className="mt-1 text-[11px] leading-snug text-white/50">{desc}</div>
    </div>
  );
}

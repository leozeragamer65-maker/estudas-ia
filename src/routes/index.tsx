import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [pergunta, setPergunta] = useState("");
  const [autenticado, setAutenticado] = useState<boolean | null>(null);

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
            O que vamos<br />
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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <aside
            className="relative flex h-full w-72 max-w-[85vw] flex-col bg-[#15100b] text-white shadow-2xl"
            style={{ animation: "estudaia-slide-in 0.25s ease-out both" }}
          >
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F97316]/15 text-[#F97316]">
                  <GraduationCap className="h-5 w-5" />
                </span>
                <span className="font-display text-lg">Estuda IA</span>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/5"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3">
              {MENU_ITEMS.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to as "/app"}
                  onClick={() => setMenuOpen(false)}
                  className="mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/80 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <Icon className="h-4 w-4 text-[#F97316]" />
                  {label}
                </Link>
              ))}
            </nav>
            {!autenticado && (
              <div className="border-t border-white/5 p-4">
                <Button
                  className="w-full bg-[#F97316] hover:bg-[#F97316]/90"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate({ to: "/login" });
                  }}
                >
                  Entrar
                </Button>
              </div>
            )}
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

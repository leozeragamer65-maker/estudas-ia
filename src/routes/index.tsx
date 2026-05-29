import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Calculator, FileText, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EstudaIA — O teu tutor académico moçambicano" },
      {
        name: "description",
        content:
          "Ajuda com matemática, resumos, traduções e trabalhos científicos. Em português de Moçambique, a qualquer hora.",
      },
      { property: "og:title", content: "EstudaIA — O teu tutor académico" },
      {
        property: "og:description",
        content: "Tira dúvidas, resolve matemática e prepara trabalhos com o EstudaIA.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-2xl font-semibold text-primary">
            EstudaIA
          </Link>
          <div className="flex gap-2">
            <Link to="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link to="/login">
              <Button>Começar grátis</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="max-w-3xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" /> Feito para estudantes moçambicanos
          </p>
          <h1 className="font-display text-5xl leading-[1.05] text-foreground md:text-7xl">
            Estuda melhor.<br />
            <span className="text-primary">Em português de Moçambique.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Tira dúvidas de qualquer disciplina, resolve exercícios de matemática passo a passo
            e prepara o teu trabalho científico — tudo num só sítio.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/login">
              <Button size="lg" className="gap-2">
                Começar agora <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#planos">
              <Button size="lg" variant="outline">
                Ver planos
              </Button>
            </a>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            3 perguntas grátis por dia. Sem cartão de crédito.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: BookOpen,
              t: "Dúvidas académicas",
              d: "Resumos, traduções, correções e explicações claras em qualquer disciplina.",
            },
            {
              icon: Calculator,
              t: "Matemática passo a passo",
              d: "Equações, fracções, integrais, matrizes — tudo formatado como num livro.",
            },
            {
              icon: FileText,
              t: "Trabalho científico",
              d: "Recolhemos os teus dados e preparamos o trabalho. Por apenas 50 MT.",
            },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl border border-border bg-card p-6">
              <Icon className="h-8 w-8 text-primary" />
              <h3 className="mt-4 font-display text-xl">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="planos" className="bg-secondary py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-4xl text-foreground">Planos simples</h2>
          <p className="mt-2 text-muted-foreground">Paga em meticais. Cancela quando quiseres.</p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { p: "Grátis", v: "0 MT", b: ["3 perguntas/dia", "1 cálculo de matemática/dia", "Histórico básico"] },
              { p: "Estudante", v: "75 MT/mês", b: ["50 perguntas/dia", "15 cálculos/dia", "Traduções e resumos"], destaque: true },
              { p: "Pro", v: "150 MT/mês", b: ["150 perguntas/dia", "50 cálculos/dia", "Apoio prioritário"] },
            ].map((pl) => (
              <div
                key={pl.p}
                className={`rounded-2xl border bg-card p-6 ${pl.destaque ? "border-primary ring-2 ring-primary/30" : "border-border"}`}
              >
                <div className="text-sm text-muted-foreground">{pl.p}</div>
                <div className="mt-1 font-display text-3xl">{pl.v}</div>
                <ul className="mt-4 space-y-2 text-sm">
                  {pl.b.map((x) => (
                    <li key={x} className="flex gap-2">
                      <span className="text-primary">•</span> {x}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} EstudaIA · Feito em Moçambique
      </footer>
    </div>
  );
}

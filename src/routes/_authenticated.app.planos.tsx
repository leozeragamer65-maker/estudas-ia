import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Sparkles, FileText, BookOpen, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getProfileWithUsage } from "@/lib/chat.functions";

export const Route = createFileRoute("/_authenticated/app/planos")({
  head: () => ({ meta: [{ title: "Planos — EstudaIA" }] }),
  component: PlanosPage,
});

const PLANOS = [
  {
    id: "free",
    nome: "Grátis",
    preco: "0 MT",
    checkout: null,
    items: [
      "3 perguntas/dia no chat",
      "1 cálculo de matemática/dia",
      "Acesso à secção de ferramentas básicas",
    ],
  },
  {
    id: "75mt",
    nome: "Básico",
    preco: "75 MT/mês",
    checkout: "https://checkout.escalepay.com/4830873",
    items: [
      "50 perguntas/dia no chat",
      "15 cálculos de matemática/dia",
      "30 traduções e 20 resumos/dia",
      "Histórico completo de conversas",
    ],
  },
  {
    id: "150mt",
    nome: "Pro",
    preco: "150 MT/mês",
    checkout: "https://checkout.escalepay.com/1971529",
    destaque: true,
    items: [
      "150 perguntas/dia no chat",
      "50 cálculos de matemática avançada/dia",
      "100 traduções e 60 resumos/dia",
      "Agente de Trabalhos Científicos prioritário",
      "Geração de apresentações (em breve)",
      "Resoluções passo-a-passo detalhadas",
      "Respostas mais rápidas e precisas",
      "Apoio prioritário via WhatsApp",
      "Sem anúncios e sem limites de tópicos",
    ],
  },
];

const TRABALHO_CHECKOUT = "https://checkout.escalepay.com/4866331";

function PlanosPage() {
  const fetchProfile = useServerFn(getProfileWithUsage);
  const { data } = useQuery({ queryKey: ["profile-usage"], queryFn: () => fetchProfile() });
  const profile = data?.profile;
  const [pendente, setPendente] = useState<{ url: string; nome: string } | null>(null);

  const confirmar = (url: string, nome: string) => setPendente({ url, nome });
  const abrir = () => {
    if (pendente) {
      window.open(pendente.url, "_blank", "noopener,noreferrer");
      setPendente(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-5xl px-5 py-8 md:px-10">
        <h1 className="font-display text-3xl">Planos</h1>
        <p className="mt-1 text-muted-foreground">
          Escolhe o plano que se adapta a ti. Pagamento via M-Pesa / e-Mola (Escalepay).
          Após a compra, o teu plano é activado automaticamente.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {PLANOS.map((pl) => {
            const actual = profile?.plano === pl.id;
            return (
              <div
                key={pl.id}
                className={`relative rounded-2xl border bg-card p-6 ${
                  pl.destaque ? "border-primary ring-2 ring-primary/40 shadow-lg" : "border-border"
                }`}
              >
                {pl.destaque && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    <Sparkles className="mr-1 inline h-3 w-3" /> Mais popular
                  </div>
                )}
                <div className="text-sm text-muted-foreground">{pl.nome}</div>
                <div className="mt-1 font-display text-3xl">{pl.preco}</div>
                <ul className="mt-4 space-y-2 text-sm">
                  {pl.items.map((x) => (
                    <li key={x} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> <span>{x}</span>
                    </li>
                  ))}
                </ul>
                {pl.checkout ? (
                  <Button
                    className="mt-5 w-full"
                    variant={pl.destaque ? "default" : "outline"}
                    disabled={actual}
                    onClick={() => confirmar(pl.checkout!, pl.nome)}
                  >
                    {actual ? "Plano actual" : `Assinar ${pl.nome}`}
                  </Button>
                ) : (
                  <Button className="mt-5 w-full" variant="outline" disabled>
                    {actual ? "Plano actual" : "Plano grátis"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <h2 className="mt-10 font-display text-2xl">Trabalho Científico e Relatório reflexivo</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-lg">Trabalho Científico</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Compra um crédito de trabalho científico completo por <strong>50 MT</strong> e
                  submete o pedido na secção "Trabalho Científico". Disponíveis:{" "}
                  <strong>{profile?.trabalhos_disponiveis ?? 0}</strong>.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => confirmar(TRABALHO_CHECKOUT, "Trabalho Científico")}
                >
                  Comprar trabalho (50 MT)
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 opacity-80">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg">Relatório reflexivo</h3>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                    Em breve
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Em breve poderás encomendar relatórios reflexivos académicos prontos a entregar.
                </p>
                <Button className="mt-4" variant="outline" disabled>
                  Em breve
                </Button>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Importante: para o pagamento ser associado à tua conta, usa no checkout o mesmo número
          de telefone com que te registaste no EstudaIA.
        </p>
      </div>

      <AlertDialog open={!!pendente} onOpenChange={(o) => !o && setPendente(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Atenção antes de pagar
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-left">
                <p>
                  Vais ser redireccionado para o pagamento de <strong>{pendente?.nome}</strong>.
                </p>
                <p>
                  O número de <strong>WhatsApp</strong> e o número usado no{" "}
                  <strong>pagamento (M-Pesa / e-Mola)</strong> devem ser <strong>os mesmos</strong>{" "}
                  com que criaste a conta no EstudaIA.
                </p>
                <p className="text-destructive">
                  Caso contrário, <strong>não será possível atribuir os benefícios à tua conta</strong>.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={abrir}>Entendi, continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


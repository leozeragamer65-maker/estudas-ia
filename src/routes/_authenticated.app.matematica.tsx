import { createFileRoute } from "@tanstack/react-router";
import { InlineMath } from "react-katex";

import { ChatView } from "@/components/ChatView";
import { useAppCtx } from "./_authenticated.app";

export const Route = createFileRoute("/_authenticated/app/matematica")({
  head: () => ({ meta: [{ title: "Matemática — EstudaIA" }] }),
  component: MatPage,
});

const FORMATOS: { label: string; tex: string }[] = [
  { label: "Fracção", tex: "\\frac{a}{b}" },
  { label: "Potência", tex: "x^{n}" },
  { label: "Raiz", tex: "\\sqrt{x}" },
  { label: "Raiz n", tex: "\\sqrt[n]{x}" },
  { label: "Equação 2º grau", tex: "ax^2+bx+c=0" },
  { label: "Soma", tex: "\\sum_{i=1}^{n} x_i" },
  { label: "Integral", tex: "\\int_a^b f(x)\\,dx" },
  { label: "Derivada", tex: "\\frac{d}{dx}f(x)" },
  { label: "Limite", tex: "\\lim_{x\\to 0} f(x)" },
  { label: "Pi", tex: "\\pi" },
  { label: "Theta", tex: "\\theta" },
  { label: "Infinito", tex: "\\infty" },
];

function MatPage() {
  const { activeChatId, setActiveChatId } = useAppCtx();
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-border bg-card px-4 py-3 md:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Formatos suportados
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {FORMATOS.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                title={f.label}
              >
                <InlineMath math={f.tex} />
                <span className="text-xs text-muted-foreground">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatView
          chatId={activeChatId}
          seccao="matematica"
          onChatCreated={setActiveChatId}
          title="Matemática"
          placeholder="Escreve a expressão ou problema e eu mostro a resolução passo a passo."
        />
      </div>
    </div>
  );
}

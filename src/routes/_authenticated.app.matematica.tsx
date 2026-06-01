import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { InlineMath } from "react-katex";

import { ChatView } from "@/components/ChatView";
import { ChatHistorySidebar, ChatHistoryMobileTrigger } from "@/components/ChatHistorySidebar";
import { listChats } from "@/lib/chat.functions";
import { useAppCtx } from "@/lib/app-ctx";

export const Route = createFileRoute("/_authenticated/app/matematica")({
  head: () => ({ meta: [{ title: "Matemática — EstudaIA" }] }),
  component: MatPage,
});

const FORMATOS: { label: string; tex: string }[] = [
  { label: "Fracção", tex: "\\frac{a}{b}" },
  { label: "Potência", tex: "x^{n}" },
  { label: "Raiz", tex: "\\sqrt{x}" },
  { label: "Raiz n", tex: "\\sqrt[n]{x}" },
  { label: "Eq. 2º grau", tex: "ax^2+bx+c=0" },
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
  const fetchChats = useServerFn(listChats);
  const { data: chats = [] } = useQuery({
    queryKey: ["chats", "matematica"],
    queryFn: () => fetchChats({ data: { seccao: "matematica" } }),
  });

  useEffect(() => {
    if (activeChatId && !chats.some((c) => c.id === activeChatId)) {
      setActiveChatId(null);
    }
  }, [chats, activeChatId, setActiveChatId]);

  return (
    <div className="flex h-full overflow-hidden">
      <ChatHistorySidebar seccao="matematica" newLabel="Nova resolução" listLabel="Histórico" />

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border bg-card px-3 py-2 md:hidden">
          <ChatHistoryMobileTrigger
            seccao="matematica"
            newLabel="Nova resolução"
            listLabel="Histórico"
          />
          <span className="font-display text-sm">Matemática</span>
        </div>

        <div className="border-b border-border bg-card px-3 py-2 md:px-8 md:py-3">
          <div className="mx-auto max-w-3xl">
            <p className="hidden text-xs uppercase tracking-wider text-muted-foreground md:block">
              Formatos suportados
            </p>
            <div className="-mx-1 mt-0 flex gap-2 overflow-x-auto px-1 pb-1 md:mt-2 md:flex-wrap md:overflow-visible">
              {FORMATOS.map((f) => (
                <div
                  key={f.label}
                  className="flex shrink-0 items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1 text-sm"
                  title={f.label}
                >
                  <InlineMath math={f.tex} />
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {f.label}
                  </span>
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
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageContent } from "./MessageContent";
import { sendMessage } from "@/lib/agent.functions";
import { getMessages } from "@/lib/chat.functions";

import type { Seccao } from "@/lib/app-ctx";

interface Props {
  chatId: string | null;
  seccao: Seccao;
  onChatCreated: (id: string) => void;
  placeholder?: string;
  title?: string;
}

export function ChatView({ chatId, seccao, onChatCreated, placeholder, title }: Props) {
  const send = useServerFn(sendMessage);
  const fetchMsgs = useServerFn(getMessages);
  const qc = useQueryClient();
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: mensagens = [] } = useQuery({
    queryKey: ["mensagens", chatId],
    queryFn: () => (chatId ? fetchMsgs({ data: { chatId } }) : Promise.resolve([])),
    enabled: !!chatId,
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [mensagens, enviando]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const pre = sessionStorage.getItem("estudaia:pergunta-inicial");
    if (pre) {
      sessionStorage.removeItem("estudaia:pergunta-inicial");
      setTexto(pre);
    }
  }, []);

  const handleEnviar = async () => {
    const t = texto.trim();
    if (!t || enviando) return;
    setEnviando(true);
    setTexto("");
    try {
      const res = await send({ data: { chatId, texto: t, seccao } });
      if (!chatId) onChatCreated(res.chatId);
      qc.invalidateQueries({ queryKey: ["mensagens", res.chatId] });
      qc.invalidateQueries({ queryKey: ["chats"] });
      qc.invalidateQueries({ queryKey: ["profile-usage"] });
      if (res.creditos.restantes <= 1) {
        toast.warning(`Restam ${res.creditos.restantes} créditos diários.`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao enviar");
      setTexto(t);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {mensagens.length === 0 && !enviando && (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <h2 className="font-display text-2xl text-foreground">
                {title ??
                  (seccao === "trabalho"
                    ? "Trabalho científico"
                    : seccao === "matematica"
                      ? "Matemática"
                      : "Como te posso ajudar?")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {placeholder ??
                  "Pergunta-me sobre qualquer disciplina. Para matemática, mostro a resolução passo a passo."}
              </p>
            </div>
          )}
          {mensagens.map((m) => (
            <MessageBubble key={m.id} role={m.role} conteudo={m.conteudo} />
          ))}
          {enviando && (
            <div className="mr-auto flex max-w-[85%] items-center gap-2 rounded-2xl rounded-bl-sm bg-card px-4 py-3 text-muted-foreground shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> A pensar…
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-background px-4 py-3 md:px-8">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleEnviar();
              }
            }}
            placeholder="Escreve a tua pergunta…"
            className="min-h-[52px] resize-none"
            rows={1}
          />
          <Button
            onClick={handleEnviar}
            disabled={enviando || !texto.trim()}
            size="lg"
            className="h-[52px]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ role, conteudo }: { role: string; conteudo: string }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(conteudo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };
  if (role === "user") {
    return (
      <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-primary-foreground">
        <MessageContent text={conteudo} />
      </div>
    );
  }
  return (
    <div className="group mr-auto max-w-[90%]">
      <div className="rounded-2xl rounded-bl-sm bg-card px-4 py-3 text-card-foreground shadow-sm">
        <MessageContent text={conteudo} />
      </div>
      <div className="mt-1 flex">
        <button
          onClick={copiar}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Copiar mensagem"
        >
          {copiado ? (
            <>
              <Check className="h-3 w-3" /> Copiado
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" /> Copiar
            </>
          )}
        </button>
      </div>
    </div>
  );
}

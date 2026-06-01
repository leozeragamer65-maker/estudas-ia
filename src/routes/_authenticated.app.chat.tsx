import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ChatView } from "@/components/ChatView";
import { Button } from "@/components/ui/button";
import { listChats, deleteChat } from "@/lib/chat.functions";
import { useAppCtx } from "@/lib/app-ctx";

export const Route = createFileRoute("/_authenticated/app/chat")({
  head: () => ({ meta: [{ title: "Chat IA — EstudaIA" }] }),
  component: ChatPage,
});

function ChatPage() {
  const { activeChatId, setActiveChatId } = useAppCtx();
  const fetchChats = useServerFn(listChats);
  const removeChat = useServerFn(deleteChat);
  const qc = useQueryClient();
  const { data: chats = [] } = useQuery({
    queryKey: ["chats", "geral"],
    queryFn: () => fetchChats({ data: { seccao: "geral" } }),
  });

  const apagar = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Apagar esta conversa?")) return;
    try {
      await removeChat({ data: { chatId: id } });
      qc.invalidateQueries({ queryKey: ["chats"] });
      if (activeChatId === id) setActiveChatId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      <aside className="hidden w-64 flex-col border-r border-border bg-card md:flex">
        <div className="p-3">
          <Button className="w-full justify-start" onClick={() => setActiveChatId(null)}>
            <Plus className="mr-2 h-4 w-4" /> Nova conversa
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          <div className="px-2 pb-2 text-xs uppercase tracking-wider text-muted-foreground">
            Conversas
          </div>
          {chats.length === 0 && (
            <div className="px-3 text-xs text-muted-foreground">Nenhuma ainda</div>
          )}
          {chats.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveChatId(c.id)}
              className={`group mb-1 flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                activeChatId === c.id ? "bg-secondary" : "hover:bg-secondary/60"
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-70" />
                <span className="truncate">{c.titulo}</span>
              </span>
              <Trash2
                onClick={(e) => apagar(c.id, e)}
                className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-70 hover:opacity-100"
              />
            </button>
          ))}
        </div>
      </aside>
      <div className="flex-1 overflow-hidden">
        <ChatView
          chatId={activeChatId}
          seccao="geral"
          onChatCreated={setActiveChatId}
        />
      </div>
    </div>
  );
}

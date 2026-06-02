import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";

import { ChatView } from "@/components/ChatView";
import { ChatHistorySidebar, ChatHistoryMobileTrigger } from "@/components/ChatHistorySidebar";
import { listChats } from "@/lib/chat.functions";
import { useAppCtx } from "@/lib/app-ctx";

export const Route = createFileRoute("/_authenticated/app/resumo")({
  head: () => ({ meta: [{ title: "Resumir texto — EstudaIA" }] }),
  component: ResumoPage,
});

function ResumoPage() {
  const { activeChatId, setActiveChatId } = useAppCtx();
  const fetchChats = useServerFn(listChats);
  const { data: chats = [] } = useQuery({
    queryKey: ["chats", "resumo"],
    queryFn: () => fetchChats({ data: { seccao: "resumo" } }),
  });
  useEffect(() => {
    if (activeChatId && !chats.some((c) => c.id === activeChatId)) setActiveChatId(null);
  }, [chats, activeChatId, setActiveChatId]);

  return (
    <div className="flex h-full overflow-hidden">
      <ChatHistorySidebar seccao="resumo" newLabel="Novo resumo" listLabel="Resumos" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border bg-card px-3 py-2 md:hidden">
          <ChatHistoryMobileTrigger seccao="resumo" newLabel="Novo resumo" listLabel="Resumos" />
          <span className="font-display text-sm">Resumir texto</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatView
            chatId={activeChatId}
            seccao="resumo"
            onChatCreated={setActiveChatId}
            title="Resumir texto"
            placeholder="Cola o texto que queres resumir."
          />
        </div>
      </div>
    </div>
  );
}

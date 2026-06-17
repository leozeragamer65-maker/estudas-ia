import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";

import { ChatView } from "@/components/ChatView";
import { ChatHistorySidebar, ChatHistoryMobileTrigger } from "@/components/ChatHistorySidebar";
import { listChats } from "@/lib/chat.functions";
import { useAppCtx } from "@/lib/app-ctx";

export const Route = createFileRoute("/_authenticated/app/tradutor")({
  head: () => ({ meta: [{ title: "Tradutor — EstudaIA" }] }),
  component: TradutorPage,
});

function TradutorPage() {
  const { activeChatId, setActiveChatId } = useAppCtx();
  const fetchChats = useServerFn(listChats);
  const { data: chats = [] } = useQuery({
    queryKey: ["chats", "traducao"],
    queryFn: () => fetchChats({ data: { seccao: "traducao" } }),
  });
  useEffect(() => {
    if (activeChatId && !chats.some((c) => c.id === activeChatId)) setActiveChatId(null);
  }, [chats, activeChatId, setActiveChatId]);

  return (
    <div className="flex h-full overflow-hidden">
      <ChatHistorySidebar seccao="traducao" newLabel="Nova tradução" listLabel="Traduções" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border bg-card px-3 py-2 md:hidden">
          <ChatHistoryMobileTrigger
            seccao="traducao"
            newLabel="Nova tradução"
            listLabel="Traduções"
          />
          <span className="font-display text-sm">Tradutor</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatView
            chatId={activeChatId}
            seccao="traducao"
            onChatCreated={setActiveChatId}
            title="Tradutor"
            placeholder="Cola o texto a traduzir e indica a língua de destino (ex: para inglês)."
          />
        </div>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";

import { ChatView } from "@/components/ChatView";
import { ChatHistorySidebar, ChatHistoryMobileTrigger } from "@/components/ChatHistorySidebar";
import { listChats } from "@/lib/chat.functions";
import { useAppCtx } from "@/lib/app-ctx";

export const Route = createFileRoute("/_authenticated/app/corretor")({
  head: () => ({ meta: [{ title: "Corrector — EstudaIA" }] }),
  component: CorretorPage,
});

function CorretorPage() {
  const { activeChatId, setActiveChatId } = useAppCtx();
  const fetchChats = useServerFn(listChats);
  const { data: chats = [] } = useQuery({
    queryKey: ["chats", "corretor"],
    queryFn: () => fetchChats({ data: { seccao: "corretor" } }),
  });
  useEffect(() => {
    if (activeChatId && !chats.some((c) => c.id === activeChatId)) setActiveChatId(null);
  }, [chats, activeChatId, setActiveChatId]);

  return (
    <div className="flex h-full overflow-hidden">
      <ChatHistorySidebar seccao="corretor" newLabel="Nova correcção" listLabel="Correcções" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border bg-card px-3 py-2 md:hidden">
          <ChatHistoryMobileTrigger
            seccao="corretor"
            newLabel="Nova correcção"
            listLabel="Correcções"
          />
          <span className="font-display text-sm">Corrector de português</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatView
            chatId={activeChatId}
            seccao="corretor"
            onChatCreated={setActiveChatId}
            title="Corrector de português"
            placeholder="Cola o texto a corrigir (ortografia, gramática e estilo)."
          />
        </div>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";

import { ChatView } from "@/components/ChatView";
import { useAppCtx } from "./_authenticated.app";

export const Route = createFileRoute("/_authenticated/app/")({
  component: ChatPage,
});

function ChatPage() {
  const { activeChatId, setActiveChatId } = useAppCtx();
  return (
    <ChatView
      chatId={activeChatId}
      seccao="geral"
      onChatCreated={setActiveChatId}
    />
  );
}

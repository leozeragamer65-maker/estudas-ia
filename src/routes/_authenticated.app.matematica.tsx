import { createFileRoute } from "@tanstack/react-router";

import { ChatView } from "@/components/ChatView";
import { useAppCtx } from "./_authenticated.app";

export const Route = createFileRoute("/_authenticated/app/matematica")({
  head: () => ({ meta: [{ title: "Matemática — EstudaIA" }] }),
  component: MatPage,
});

function MatPage() {
  const { activeChatId, setActiveChatId } = useAppCtx();
  return (
    <ChatView
      chatId={activeChatId}
      seccao="matematica"
      onChatCreated={setActiveChatId}
      title="Matemática"
      placeholder="Escreve a expressão ou problema e eu mostro a resolução passo a passo."
    />
  );
}

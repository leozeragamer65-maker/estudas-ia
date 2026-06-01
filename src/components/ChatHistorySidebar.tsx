import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, MessageSquare, Trash2, History } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { listChats, deleteChat } from "@/lib/chat.functions";
import { useAppCtx } from "@/lib/app-ctx";
import type { Seccao } from "@/lib/app-ctx";

interface Props {
  seccao: Seccao;
  newLabel: string;
  listLabel: string;
}

function HistoryList({ seccao, newLabel, listLabel, onPick }: Props & { onPick?: () => void }) {
  const { activeChatId, setActiveChatId } = useAppCtx();
  const fetchChats = useServerFn(listChats);
  const removeChat = useServerFn(deleteChat);
  const qc = useQueryClient();
  const { data: chats = [] } = useQuery({
    queryKey: ["chats", seccao],
    queryFn: () => fetchChats({ data: { seccao } }),
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
    <div className="flex h-full flex-col">
      <div className="p-3">
        <Button
          className="w-full justify-start"
          onClick={() => {
            setActiveChatId(null);
            onPick?.();
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> {newLabel}
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        <div className="px-2 pb-2 text-xs uppercase tracking-wider text-muted-foreground">
          {listLabel}
        </div>
        {chats.length === 0 && (
          <div className="px-3 text-xs text-muted-foreground">Nenhuma ainda</div>
        )}
        {chats.map((c) => (
          <div
            key={c.id}
            onClick={() => {
              setActiveChatId(c.id);
              onPick?.();
            }}
            className={`group mb-1 flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
              activeChatId === c.id ? "bg-secondary" : "hover:bg-secondary/60"
            }`}
          >
            <span className="flex items-center gap-2 truncate">
              <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-70" />
              <span className="truncate">{c.titulo}</span>
            </span>
            <button
              type="button"
              onClick={(e) => apagar(c.id, e)}
              className="shrink-0 rounded p-1 opacity-60 hover:opacity-100 md:opacity-0 md:group-hover:opacity-70"
              aria-label="Apagar"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChatHistorySidebar(props: Props) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:flex">
      <HistoryList {...props} />
    </aside>
  );
}

export function ChatHistoryMobileTrigger(props: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="md:hidden">
          <History className="mr-2 h-4 w-4" /> Histórico
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-card p-0">
        <SheetHeader className="border-b border-border px-4 py-3">
          <SheetTitle className="text-left">{props.listLabel}</SheetTitle>
        </SheetHeader>
        <HistoryList {...props} onPick={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

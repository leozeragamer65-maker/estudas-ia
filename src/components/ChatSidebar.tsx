import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, MessageSquare, FileText, User, LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { listChats, deleteChat } from "@/lib/chat.functions";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  activeChatId: string | null;
  onSelectChat: (id: string | null) => void;
}

export function ChatSidebar({ activeChatId, onSelectChat }: Props) {
  const fetchChats = useServerFn(listChats);
  const removeChat = useServerFn(deleteChat);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: chats = [] } = useQuery({
    queryKey: ["chats"],
    queryFn: () => fetchChats(),
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Apagar esta conversa?")) return;
    try {
      await removeChat({ data: { chatId: id } });
      qc.invalidateQueries({ queryKey: ["chats"] });
      if (activeChatId === id) onSelectChat(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  };

  return (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-4 py-4">
        <Link to="/" className="block font-display text-xl">
          EstudaIA
        </Link>
      </div>

      <div className="px-3">
        <Button
          variant="secondary"
          className="w-full justify-start bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80"
          onClick={() => onSelectChat(null)}
        >
          <Plus className="mr-2 h-4 w-4" /> Nova conversa
        </Button>
      </div>

      <nav className="mt-4 flex flex-col gap-1 px-2">
        <Link
          to="/app/trabalhos"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent"
          activeProps={{ className: "bg-sidebar-accent" }}
        >
          <FileText className="h-4 w-4" /> Trabalho científico
        </Link>
        <Link
          to="/conta"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent"
          activeProps={{ className: "bg-sidebar-accent" }}
        >
          <User className="h-4 w-4" /> Conta & plano
        </Link>
      </nav>

      <div className="mt-4 flex-1 overflow-y-auto px-2">
        <div className="px-2 pb-2 text-xs uppercase tracking-wider text-sidebar-foreground/60">
          Conversas
        </div>
        {chats.length === 0 && (
          <div className="px-3 text-xs text-sidebar-foreground/50">Nenhuma ainda</div>
        )}
        {chats.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelectChat(c.id)}
            className={`group flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
              activeChatId === c.id
                ? "bg-sidebar-accent"
                : "hover:bg-sidebar-accent/60"
            }`}
          >
            <span className="flex items-center gap-2 truncate">
              <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-70" />
              <span className="truncate">{c.titulo}</span>
            </span>
            <Trash2
              onClick={(e) => handleDelete(c.id, e)}
              className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-70 hover:opacity-100"
            />
          </button>
        ))}
      </div>

      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" /> Sair
        </Button>
      </div>
    </aside>
  );
}

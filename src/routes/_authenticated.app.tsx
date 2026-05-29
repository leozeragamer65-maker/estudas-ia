import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useState, createContext, useContext } from "react";
import { Menu, X } from "lucide-react";

import { ChatSidebar } from "@/components/ChatSidebar";
import { Button } from "@/components/ui/button";

interface AppCtx {
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
}
const Ctx = createContext<AppCtx | null>(null);
export const useAppCtx = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppCtx fora do provider");
  return v;
};

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "EstudaIA — Chat" }] }),
  component: AppShell,
});

function AppShell() {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Ctx.Provider value={{ activeChatId, setActiveChatId }}>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar desktop */}
        <div className="hidden md:flex">
          <ChatSidebar
            activeChatId={activeChatId}
            onSelectChat={(id) => setActiveChatId(id)}
          />
        </div>

        {/* Sidebar mobile (drawer) */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative z-50">
              <ChatSidebar
                activeChatId={activeChatId}
                onSelectChat={(id) => {
                  setActiveChatId(id);
                  setMobileOpen(false);
                }}
              />
            </div>
          </div>
        )}

        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex h-12 items-center border-b border-border px-3 md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen((v) => !v)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <span className="ml-2 font-display text-lg text-primary">EstudaIA</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <Outlet />
          </div>
        </main>
      </div>
    </Ctx.Provider>
  );
}

import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Menu, X } from "lucide-react";

import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { GoogleLinkGate } from "@/components/GoogleLinkGate";
import { getProfileWithUsage } from "@/lib/chat.functions";
import { AppCtxContext, useAppCtx } from "@/lib/app-ctx";

export { useAppCtx };

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "EstudaIA — Painel" }] }),
  component: AppShell,
  errorComponent: ({ error }) => (
    <div className="flex h-screen items-center justify-center p-6 text-center">
      <div>
        <h2 className="font-display text-xl">Não foi possível carregar</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </div>
  ),
});

function AppShell() {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const fetchProfile = useServerFn(getProfileWithUsage);
  const { data } = useQuery({ queryKey: ["profile-usage"], queryFn: () => fetchProfile() });
  const plano = data?.profile?.plano ?? "free";
  const isAdmin = !!data?.isAdmin;

  return (
    <AppCtxContext.Provider value={{ activeChatId, setActiveChatId }}>
      <GoogleLinkGate>
        <div className="flex h-screen overflow-hidden bg-background">
          <div className="hidden md:flex">
            <AppSidebar plano={plano} isAdmin={isAdmin} />
          </div>

          {mobileOpen && (
            <div className="fixed inset-0 z-40 flex md:hidden">
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setMobileOpen(false)}
              />
              <div className="relative z-50">
                <AppSidebar plano={plano} isAdmin={isAdmin} onNavigate={() => setMobileOpen(false)} />
              </div>
            </div>
          )}

          <main className="flex flex-1 flex-col overflow-hidden">
            <div className="flex h-12 items-center border-b border-border bg-sidebar px-3 text-sidebar-foreground md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen((v) => !v)}
                className="text-sidebar-foreground hover:bg-sidebar-accent"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <span className="ml-2 font-display text-lg">EstudaIA</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <Outlet />
            </div>
          </main>
        </div>
      </GoogleLinkGate>
    </AppCtxContext.Provider>
  );
}

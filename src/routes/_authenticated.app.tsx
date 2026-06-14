import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";

import { AppSidebar } from "@/components/AppSidebar";
import { MobileNav } from "@/components/MobileNav";
import { getProfileWithUsage } from "@/lib/chat.functions";
import { AppCtxContext, useAppCtx } from "@/lib/app-ctx";
import { GoogleLinkGate } from "@/components/GoogleLinkGate";

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
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const fetchProfile = useServerFn(getProfileWithUsage);
  const { data } = useQuery({ queryKey: ["profile-usage"], queryFn: () => fetchProfile() });
  const plano = data?.profile?.plano ?? "free";
  const isAdmin = !!data?.isAdmin;

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  return (
    <AppCtxContext.Provider value={{ activeChatId, setActiveChatId }}>
      <GoogleLinkGate>
        <div className="flex h-screen overflow-hidden bg-background">
          {/* Desktop Sidebar */}
          <div className="hidden md:flex">
            <AppSidebar plano={plano} isAdmin={isAdmin} />
          </div>

          {/* Mobile Navigation */}
          <MobileNav plano={plano} isAdmin={isAdmin} />

          {/* Main Content */}
          <main className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <Outlet />
            </div>
          </main>
        </div>
      </GoogleLinkGate>
    </AppCtxContext.Provider>
  );
}

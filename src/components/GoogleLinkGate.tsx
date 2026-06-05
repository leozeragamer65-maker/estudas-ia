import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getProfileWithUsage } from "@/lib/chat.functions";
import { syncGoogleEmail } from "@/lib/google-link.functions";

export function GoogleLinkGate({ children }: { children: React.ReactNode }) {
  const fetchProfile = useServerFn(getProfileWithUsage);
  const sync = useServerFn(syncGoogleEmail);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["profile-usage"],
    queryFn: () => fetchProfile(),
  });
  const [linking, setLinking] = useState(false);

  const googleEmail = (data?.profile as { google_email?: string | null } | undefined)?.google_email;
  const precisaLigar = !isLoading && data?.profile && !googleEmail;

  // Quando o utilizador regressa do OAuth de linking, a sessão é actualizada.
  // Tentamos sincronizar imediatamente o email Google.
  useEffect(() => {
    if (!precisaLigar) return;
    let alive = true;
    (async () => {
      try {
        const res = await sync();
        if (alive && res?.google_email) {
          await qc.invalidateQueries({ queryKey: ["profile-usage"] });
        }
      } catch {
        /* silencioso — utilizador ainda não ligou */
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "USER_UPDATED" || event === "SIGNED_IN") {
        try {
          const res = await sync();
          if (res?.google_email) qc.invalidateQueries({ queryKey: ["profile-usage"] });
        } catch {/* noop */}
      }
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [precisaLigar, sync, qc]);

  const ligar = async () => {
    setLinking(true);
    try {
      const { data: linkData, error } = await supabase.auth.linkIdentity({
        provider: "google",
        options: { redirectTo: window.location.origin + "/app" },
      });
      if (error) throw error;
      // Em geral haverá redirect. Se não houver, tentamos sincronizar.
      if (!linkData?.url) {
        const res = await sync();
        if (res?.google_email) {
          toast.success("Conta Google ligada!");
          qc.invalidateQueries({ queryKey: ["profile-usage"] });
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao ligar Google";
      toast.error(msg);
      setLinking(false);
    }
  };

  return (
    <>
      {children}
      {precisaLigar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-center">
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <ShieldCheck className="h-7 w-7" />
              </div>
            </div>
            <h2 className="mt-4 text-center font-display text-2xl">
              Liga a tua conta Google
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Para continuares a usar o EstudaIA, precisas de associar uma conta
              Google ao teu perfil. Isto é obrigatório e permite recuperação de
              acesso, maior segurança e login mais rápido.
            </p>
            <Button
              onClick={ligar}
              disabled={linking}
              className="mt-6 w-full"
              size="lg"
            >
              {linking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> A redirecionar…
                </>
              ) : (
                <>
                  <GoogleIcon /> Conectar conta Google
                </>
              )}
            </Button>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Não é possível ignorar este passo.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="mr-2 h-4 w-4" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35 26.8 36 24 36c-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C40.9 35.6 44 30.3 44 24c0-1.3-.1-2.3-.4-3.5z"/>
    </svg>
  );
}

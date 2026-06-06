import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getProfileWithUsage } from "@/lib/chat.functions";
import { saveGoogleEmail } from "@/lib/google-link.functions";

export function GoogleLinkGate({ children }: { children: React.ReactNode }) {
  const fetchProfile = useServerFn(getProfileWithUsage);
  const save = useServerFn(saveGoogleEmail);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["profile-usage"],
    queryFn: () => fetchProfile(),
  });
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const googleEmail = (data?.profile as { google_email?: string | null } | undefined)?.google_email;
  const precisaLigar = !isLoading && data?.profile && !googleEmail;

  const submeter = async (e: FormEvent) => {
    e.preventDefault();
    const v = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      toast.error("Email inválido. Verifica antes de continuar.");
      return;
    }
    setSaving(true);
    try {
      await save({ data: { email: v } });
      toast.success("Email Google guardado!");
      await qc.invalidateQueries({ queryKey: ["profile-usage"] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao guardar email";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {children}
      {precisaLigar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-center">
              <div className="rounded-full bg-primary/10 p-3">
                <GoogleIcon className="h-7 w-7" />
              </div>
            </div>
            <h2 className="mt-4 text-center font-display text-2xl">
              Informa o teu email Google
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Precisamos do teu endereço de email Google (Gmail) associado à
              tua conta. Isto serve para recuperação de acesso e maior
              segurança.
            </p>
            <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-center text-xs text-amber-700 dark:text-amber-300">
              Informa <strong>correctamente</strong> o teu endereço de email
              Google (Gmail). Certifica-te de que não há erros de digitação
              antes de continuar.
            </div>
            <form onSubmit={submeter} className="mt-5 space-y-3">
              <div>
                <Label htmlFor="gmail">Email Google</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="gmail"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="nome@gmail.com"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={saving} className="w-full" size="lg">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> A guardar…
                  </>
                ) : (
                  <>
                    <GoogleIcon className="mr-2 h-4 w-4" /> Guardar email Google
                  </>
                )}
              </Button>
            </form>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Não é possível ignorar este passo.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35 26.8 36 24 36c-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C40.9 35.6 44 30.3 44 24c0-1.3-.1-2.3-.4-3.5z"/>
    </svg>
  );
}

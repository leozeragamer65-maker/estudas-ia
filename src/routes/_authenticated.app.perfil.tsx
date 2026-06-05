import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, Star, MessageCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { getProfileWithUsage } from "@/lib/chat.functions";
import { supabase } from "@/integrations/supabase/client";
import { getMyAvaliacao, saveAvaliacao, enviarContato } from "@/lib/feedback.functions";
import { getQuizStats } from "@/lib/quiz.functions";

export const Route = createFileRoute("/_authenticated/app/perfil")({
  head: () => ({ meta: [{ title: "Perfil — EstudaIA" }] }),
  component: PerfilPage,
});

const CATEGORIAS = [
  { v: "problema_tecnico", l: "Problema técnico" },
  { v: "sugestao", l: "Sugestão" },
  { v: "duvida", l: "Dúvida" },
  { v: "parceria", l: "Parceria" },
  { v: "denuncia", l: "Denúncia" },
  { v: "outro", l: "Outro" },
];

function PerfilPage() {
  const fetchProfile = useServerFn(getProfileWithUsage);
  const fetchAv = useServerFn(getMyAvaliacao);
  const fetchStats = useServerFn(getQuizStats);
  const { data } = useQuery({ queryKey: ["profile-usage"], queryFn: () => fetchProfile() });
  const { data: avaliacao } = useQuery({ queryKey: ["minha-avaliacao"], queryFn: () => fetchAv() });
  const { data: stats } = useQuery({ queryKey: ["quiz-stats"], queryFn: () => fetchStats() });
  const profile = data?.profile;
  const uso = data?.uso;
  const navigate = useNavigate();

  const sair = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-3xl space-y-6 px-5 py-8 md:px-10">
        <h1 className="font-display text-3xl">Perfil</h1>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="text-sm text-muted-foreground">Nome</div>
          <div className="font-display text-2xl">{profile?.nome || "Estudante"}</div>
          <div className="mt-1 text-sm text-muted-foreground">+{profile?.telefone}</div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
            Plano: {(profile?.plano ?? "free").toUpperCase()}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Box label="Chat hoje" v={uso?.chat ?? 0} />
            <Box label="Matemática" v={uso?.matematica ?? 0} />
            <Box label="Traduções" v={uso?.traducao ?? 0} />
            <Box label="Resumos" v={uso?.resumo ?? 0} />
          </div>

          {stats && (
            <div className="mt-4 rounded-lg bg-secondary px-3 py-2 text-sm">
              <span className="text-muted-foreground">Quizzes respondidos: </span>
              <span className="font-medium">{stats.total}</span>
              <span className="text-muted-foreground"> • Acertos: </span>
              <span className="font-medium">{stats.acertos} ({stats.taxa}%)</span>
            </div>
          )}
        </div>

        <AvaliacaoCard initial={avaliacao} />
        <ContatoCard telefone={profile?.telefone ?? ""} />

        <Button variant="outline" onClick={sair}>
          <LogOut className="mr-2 h-4 w-4" /> Terminar sessão
        </Button>
      </div>
    </div>
  );
}

function AvaliacaoCard({ initial }: { initial: any }) {
  const save = useServerFn(saveAvaliacao);
  const qc = useQueryClient();
  const [estrelas, setEstrelas] = useState<number>(initial?.estrelas ?? 0);
  const [comentario, setComentario] = useState<string>(initial?.comentario ?? "");
  const [saving, setSaving] = useState(false);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    if (initial) {
      setEstrelas(initial.estrelas);
      setComentario(initial.comentario ?? "");
    }
  }, [initial]);

  const enviar = async () => {
    if (estrelas < 1) {
      toast.error("Escolhe pelo menos 1 estrela.");
      return;
    }
    setSaving(true);
    try {
      await save({ data: { estrelas, comentario } });
      qc.invalidateQueries({ queryKey: ["minha-avaliacao"] });
      setEnviado(true);
      toast.success("Obrigado pela tua avaliação! 💛");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao enviar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <Star className="h-5 w-5 text-primary" />
        <h2 className="font-display text-xl">Avaliar a aplicação</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Como avalias a tua experiência? Podes editar quando quiseres.
      </p>
      <div className="mt-4 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setEstrelas(n)}
            className="transition-transform hover:scale-110"
            aria-label={`${n} estrelas`}
          >
            <Star className={`h-8 w-8 ${n <= estrelas ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
          </button>
        ))}
      </div>
      <Textarea
        className="mt-3"
        placeholder="Comentário (opcional)…"
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        maxLength={1000}
        rows={3}
      />
      <div className="mt-3 flex items-center gap-3">
        <Button onClick={enviar} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initial ? "Atualizar avaliação" : "Enviar avaliação"}
        </Button>
        {enviado && <span className="text-sm text-emerald-600">✅ Obrigado!</span>}
      </div>
    </div>
  );
}

function ContatoCard({ telefone }: { telefone: string }) {
  const enviar = useServerFn(enviarContato);
  const [tel, setTel] = useState(telefone);
  const [categoria, setCategoria] = useState<string>("duvida");
  const [motivo, setMotivo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => { if (telefone) setTel(telefone); }, [telefone]);

  const submit = async () => {
    const limpo = tel.replace(/\D+/g, "");
    if (limpo.length < 9 || limpo.length > 15) {
      toast.error("Telefone inválido (9 a 15 dígitos).");
      return;
    }
    if (motivo.trim().length < 3) {
      toast.error("Indica o motivo do contacto.");
      return;
    }
    setEnviando(true);
    try {
      await enviar({ data: { telefone: limpo, categoria: categoria as any, motivo: motivo.trim(), mensagem: mensagem.trim() } });
      toast.success("Pedido enviado. Vais receber resposta no WhatsApp.");
      setMotivo(""); setMensagem("");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao enviar");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h2 className="font-display text-xl">Falar com a Administração</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        A equipa responde via WhatsApp ao número que indicares.
      </p>
      <div className="mt-4 grid gap-3">
        <div>
          <Label>Telefone (WhatsApp)</Label>
          <Input value={tel} onChange={(e) => setTel(e.target.value)} placeholder="84xxxxxxx" />
        </div>
        <div>
          <Label>Categoria</Label>
          <Select value={categoria} onValueChange={setCategoria}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIAS.map((c) => <SelectItem key={c.v} value={c.v}>{c.l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Motivo *</Label>
          <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={200} />
        </div>
        <div>
          <Label>Mensagem (opcional)</Label>
          <Textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} maxLength={2000} rows={4} />
        </div>
        <Button onClick={submit} disabled={enviando}>
          {enviando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enviar à Administração
        </Button>
      </div>
    </div>
  );
}

function Box({ label, v }: { label: string; v: number }) {
  return (
    <div className="rounded-lg bg-secondary px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-display text-2xl">{v}</div>
    </div>
  );
}

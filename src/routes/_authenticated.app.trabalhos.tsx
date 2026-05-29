import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChatView } from "@/components/ChatView";
import { useAppCtx } from "./_authenticated.app";
import { getProfileWithUsage, submeterTrabalho } from "@/lib/chat.functions";

export const Route = createFileRoute("/_authenticated/app/trabalhos")({
  head: () => ({ meta: [{ title: "Trabalho científico — EstudaIA" }] }),
  component: TrabalhosPage,
});

function TrabalhosPage() {
  const { activeChatId, setActiveChatId } = useAppCtx();
  const fetchProfile = useServerFn(getProfileWithUsage);
  const enviar = useServerFn(submeterTrabalho);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["profile-usage"], queryFn: () => fetchProfile() });
  const disponiveis = data?.profile?.trabalhos_disponiveis ?? 0;

  const [form, setForm] = useState({
    tema: "",
    disciplina: "",
    nivel: "Licenciatura",
    paginas: 10,
    prazo: "7 dias",
    observacoes: "",
  });
  const [enviando, setEnviando] = useState(false);

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await enviar({ data: form });
      toast.success("Trabalho registado! Vais ser notificado quando estiver pronto.");
      setForm({ ...form, tema: "", observacoes: "" });
      qc.invalidateQueries({ queryKey: ["profile-usage"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden md:flex-row">
      <div className="border-b border-border bg-card p-6 md:w-96 md:overflow-y-auto md:border-b-0 md:border-r">
        <h2 className="font-display text-2xl">Trabalho científico</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Preenche os dados e nós preparamos o teu trabalho.
        </p>
        <div className="mt-3 rounded-lg bg-secondary px-3 py-2 text-sm">
          Disponíveis: <strong>{disponiveis}</strong>
          {disponiveis === 0 && (
            <span className="block text-xs text-muted-foreground">
              Compra um trabalho (50 MT) na página da Conta.
            </span>
          )}
        </div>

        <form onSubmit={submeter} className="mt-5 space-y-3">
          <div>
            <Label>Tema</Label>
            <Input
              value={form.tema}
              onChange={(e) => setForm({ ...form, tema: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Disciplina</Label>
            <Input
              value={form.disciplina}
              onChange={(e) => setForm({ ...form, disciplina: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Nível</Label>
              <Input
                value={form.nivel}
                onChange={(e) => setForm({ ...form, nivel: e.target.value })}
              />
            </div>
            <div>
              <Label>Páginas</Label>
              <Input
                type="number"
                min={1}
                max={200}
                value={form.paginas}
                onChange={(e) => setForm({ ...form, paginas: Number(e.target.value) })}
              />
            </div>
          </div>
          <div>
            <Label>Prazo</Label>
            <Input
              value={form.prazo}
              onChange={(e) => setForm({ ...form, prazo: e.target.value })}
            />
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              rows={3}
            />
          </div>
          <Button type="submit" className="w-full" disabled={enviando || disponiveis === 0}>
            {enviando ? "A enviar…" : "Submeter trabalho"}
          </Button>
        </form>
      </div>

      <div className="flex-1 overflow-hidden">
        <ChatView
          chatId={activeChatId}
          seccao="trabalho"
          onChatCreated={setActiveChatId}
          placeholder="Posso ajudar-te a definir o tema, estrutura ou esclarecer dúvidas sobre o trabalho."
        />
      </div>
    </div>
  );
}

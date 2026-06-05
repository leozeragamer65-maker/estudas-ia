import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Upload, Loader2, ShieldAlert, Star, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import {
  adminListTrabalhos,
  adminSignUpload,
  adminEntregar,
  signDownload,
} from "@/lib/trabalhos.functions";
import { adminListAvaliacoes, adminListContatos } from "@/lib/feedback.functions";
import { getProfileWithUsage } from "@/lib/chat.functions";

export const Route = createFileRoute("/_authenticated/app/admin")({
  head: () => ({ meta: [{ title: "Painel ADM — EstudaIA" }] }),
  component: AdminPage,
});

function AdminPage() {
  const fetchProfile = useServerFn(getProfileWithUsage);
  const list = useServerFn(adminListTrabalhos);
  const sign = useServerFn(adminSignUpload);
  const entregar = useServerFn(adminEntregar);
  const dl = useServerFn(signDownload);
  const listAv = useServerFn(adminListAvaliacoes);
  const listCt = useServerFn(adminListContatos);
  const qc = useQueryClient();

  const { data: prof, isLoading: lp } = useQuery({ queryKey: ["profile-usage"], queryFn: () => fetchProfile() });
  const { data: trabalhos = [], isLoading } = useQuery({
    queryKey: ["admin-trabalhos"],
    queryFn: () => list(),
    enabled: !!prof?.isAdmin,
  });
  const { data: avaliacoes = [] } = useQuery({
    queryKey: ["admin-avaliacoes"], queryFn: () => listAv(), enabled: !!prof?.isAdmin,
  });
  const { data: contatos = [] } = useQuery({
    queryKey: ["admin-contatos"], queryFn: () => listCt(), enabled: !!prof?.isAdmin,
  });

  if (lp) return <Centro><Loader2 className="h-6 w-6 animate-spin"/></Centro>;
  if (!prof?.isAdmin) return (
    <Centro>
      <div className="max-w-sm text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-destructive"/>
        <h2 className="mt-3 font-display text-xl">Acesso restrito</h2>
        <p className="mt-1 text-sm text-muted-foreground">Esta área é apenas para o administrador.</p>
      </div>
    </Centro>
  );

  const baixar = async (path: string) => {
    const { url } = await dl({ data: { path } });
    window.open(url, "_blank");
  };

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
        <h1 className="font-display text-3xl">Painel ADM</h1>

        <Tabs defaultValue="trabalhos" className="mt-6">
          <TabsList>
            <TabsTrigger value="trabalhos">Trabalhos</TabsTrigger>
            <TabsTrigger value="avaliacoes">
              <Star className="mr-1 h-4 w-4"/> Avaliações ({avaliacoes.length})
            </TabsTrigger>
            <TabsTrigger value="contatos">
              <MessageCircle className="mr-1 h-4 w-4"/> Contactos ({contatos.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trabalhos" className="mt-4">
            <p className="text-sm text-muted-foreground">Baixa os materiais do aluno, faz o trabalho e envia o ficheiro final.</p>
            {isLoading ? (
              <div className="mt-4"><Loader2 className="h-5 w-5 animate-spin"/></div>
            ) : trabalhos.length === 0 ? (
              <p className="mt-4 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Sem pedidos pendentes.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {trabalhos.map((t:any)=>(
                  <CardTrabalho
                    key={t.id}
                    t={t}
                    onBaixar={baixar}
                    onEntregar={async (file)=>{
                      const { path, token } = await sign({ data: { trabalhoId: t.id, nome: file.name }});
                      const { error } = await supabase.storage.from("trabalhos-anexos").uploadToSignedUrl(path, token, file);
                      if (error) throw error;
                      await entregar({ data: { trabalhoId: t.id, ficheiroPath: path }});
                      qc.invalidateQueries({ queryKey: ["admin-trabalhos"] });
                      toast.success("Trabalho entregue ao aluno ✅");
                    }}
                  />
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="avaliacoes" className="mt-4 space-y-3">
            {avaliacoes.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Sem avaliações.</p>
            ) : avaliacoes.map((a:any)=>(
              <div key={a.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-1">
                  {Array.from({length:5}).map((_,i)=>(
                    <Star key={i} className={`h-4 w-4 ${i < a.estrelas ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}/>
                  ))}
                  <span className="ml-2 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("pt-PT")}</span>
                </div>
                {a.comentario && <p className="mt-2 text-sm">{a.comentario}</p>}
                <p className="mt-2 text-xs text-muted-foreground">User: {a.user_id}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="contatos" className="mt-4 space-y-3">
            {contatos.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Sem contactos.</p>
            ) : contatos.map((c:any)=>(
              <div key={c.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{c.categoria.replace("_"," ")}</Badge>
                  <Badge variant="outline">{c.status}</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString("pt-PT")}</span>
                </div>
                <div className="mt-2 font-medium">{c.motivo}</div>
                {c.mensagem && <p className="mt-1 text-sm text-muted-foreground">{c.mensagem}</p>}
                <a
                  href={`https://wa.me/${c.telefone}?text=${encodeURIComponent(`Olá! Sobre o teu contacto (${c.categoria.replace("_"," ")}): ${c.motivo}`)}`}
                  target="_blank" rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
                >
                  <MessageCircle className="h-4 w-4"/> Responder por WhatsApp ({c.telefone})
                </a>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function CardTrabalho({ t, onBaixar, onEntregar }: { t:any; onBaixar:(p:string)=>void; onEntregar:(f:File)=>Promise<void> }) {
  const [enviando, setEnviando] = useState(false);
  const d = t.dados_formulario ?? {};
  return (
    <li className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium">{t.titulo ?? d.tema}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <Badge>{t.status}</Badge>
            <span className="text-muted-foreground">{new Date(t.created_at).toLocaleString("pt-PT")}</span>
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
        <Linha k="Aluno" v={`${d.nome_completo ?? "—"} (${d.turma ?? "—"}, nº ${d.numero_aluno ?? "—"})`}/>
        <Linha k="Escola" v={d.escola}/>
        <Linha k="Curso" v={d.curso}/>
        <Linha k="Orientador" v={`${d.orientador_nome ?? "—"} — ${d.orientador_cargo ?? "—"}`}/>
        <Linha k="Nível / Páginas" v={`${d.nivel_academico ?? "—"} / ${d.paginas ?? "—"} pág`}/>
        <Linha k="Citação" v={d.formato_citacao}/>
        <Linha k="Data" v={`${d.mes ?? "—"} ${d.ano ?? ""} — ${d.cidade ?? ""}`}/>
      </div>

      {t.anexos?.length > 0 && (
        <div className="mt-3">
          <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Anexos do aluno</div>
          <ul className="space-y-1">
            {t.anexos.map((a:any)=>(
              <li key={a.path} className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
                <span className="truncate">{a.nome}</span>
                <Button size="sm" variant="ghost" onClick={()=>onBaixar(a.path)}><Download className="h-4 w-4"/></Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        {t.ficheiro_url ? (
          <Button size="sm" variant="outline" onClick={()=>onBaixar(t.ficheiro_url)}>
            <Download className="mr-1 h-4 w-4"/>Ver entrega ({t.status})
          </Button>
        ) : null}
        <label className="ml-auto inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          {enviando ? <Loader2 className="h-4 w-4 animate-spin"/> : <Upload className="h-4 w-4"/>}
          {t.ficheiro_url ? "Substituir entrega" : "Enviar trabalho final"}
          <input type="file" className="hidden" disabled={enviando}
            onChange={async (e)=>{
              const file = e.target.files?.[0]; e.target.value="";
              if (!file) return;
              setEnviando(true);
              try { await onEntregar(file); }
              catch(err:any) { toast.error(err.message ?? "Erro ao enviar"); }
              finally { setEnviando(false); }
            }}/>
        </label>
      </div>
    </li>
  );
}

function Linha({ k, v }: { k: string; v: any }) {
  return <div><span className="text-muted-foreground">{k}: </span><span>{v ?? "—"}</span></div>;
}

function Centro({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full items-center justify-center p-6">{children}</div>;
}

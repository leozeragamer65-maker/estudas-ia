import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload, FileText, Download, X, Info } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  createTrabalho,
  listMyTrabalhos,
  signAnexoUpload,
  signDownload,
} from "@/lib/trabalhos.functions";
import { getProfileWithUsage } from "@/lib/chat.functions";

export const Route = createFileRoute("/_authenticated/app/trabalhos")({
  head: () => ({ meta: [{ title: "Trabalho científico — EstudaIA" }] }),
  component: TrabalhosPage,
});

const MESES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];
const ANO_ACTUAL = new Date().getFullYear();
const TIPOS_OK = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

type Anexo = { path: string; nome: string; tamanho: number };

function TrabalhosPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fetchProfile = useServerFn(getProfileWithUsage);
  const fetchTrabs = useServerFn(listMyTrabalhos);
  const sign = useServerFn(signAnexoUpload);
  const create = useServerFn(createTrabalho);
  const dl = useServerFn(signDownload);

  const { data: prof } = useQuery({ queryKey: ["profile-usage"], queryFn: () => fetchProfile() });
  const { data: trabalhos = [] } = useQuery({ queryKey: ["trabalhos"], queryFn: () => fetchTrabs() });
  const disponiveis = prof?.profile?.trabalhos_disponiveis ?? 0;

  // Form state
  const [f, setF] = useState({
    nome_completo: "", turma: "", numero_aluno: "",
    escola: "", curso: "",
    orientador_nome: "", orientador_cargo: "",
    tema: "", nivel_academico: "Médio" as "Médio" | "Superior",
    paginas: 8, formato_citacao: "APA" as "APA" | "ABNT" | "Vancouver",
    mes: MESES[new Date().getMonth()], ano: ANO_ACTUAL, cidade: "",
    instrucoes_extra: "",
  });
  const [tipoFonte, setTipoFonte] = useState<"internet" | "anexo">("internet");
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [gerando, setGerando] = useState(false);

  const upd = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 20 * 1024 * 1024) { toast.error(`${file.name}: máx 20MB`); continue; }
        if (!TIPOS_OK.includes(file.type) && !/\.(pdf|docx?|xlsx?)$/i.test(file.name)) {
          toast.error(`${file.name}: só PDF, Word ou Excel`); continue;
        }
        const { path, token } = await sign({ data: { nome: file.name, tamanho: file.size } });
        const { error } = await supabase.storage
          .from("trabalhos-anexos")
          .uploadToSignedUrl(path, token, file);
        if (error) { toast.error(`Falha em ${file.name}: ${error.message}`); continue; }
        setAnexos((p) => [...p, { path, nome: file.name, tamanho: file.size }]);
      }
    } finally { setUploading(false); }
  };

  const removerAnexo = (path: string) =>
    setAnexos((p) => p.filter((a) => a.path !== path));

  const baixar = async (path: string) => {
    const { url } = await dl({ data: { path } });
    window.open(url, "_blank");
  };

  const submeter = async () => {
    if (disponiveis <= 0) {
      toast.error("Sem trabalhos disponíveis. Compra 1 (50 MT) em Planos.");
      return;
    }
    // Validação mínima
    const obrig = ["nome_completo","turma","numero_aluno","escola","curso","orientador_nome","orientador_cargo","tema","cidade"] as const;
    for (const k of obrig) if (!String(f[k] ?? "").trim()) { toast.error("Preenche todos os campos obrigatórios."); return; }
    if (f.paginas < 8) { toast.error("Mínimo 8 páginas."); return; }
    if (tipoFonte === "anexo" && anexos.length === 0) {
      toast.error("Anexa pelo menos um ficheiro."); return;
    }
    setGerando(true);
    try {
      await create({ data: { dados: f, tipo_fonte: tipoFonte, anexos } });
      if (tipoFonte === "internet") {
        toast.success("A gerar o teu trabalho... Isto pode demorar alguns minutos.");
      } else {
        toast.success("Pedido enviado ao administrador. Prazo até 6h.");
      }
      setAnexos([]);
      qc.invalidateQueries({ queryKey: ["trabalhos"] });
      qc.invalidateQueries({ queryKey: ["profile-usage"] });
      navigate({ to: "/app" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao enviar");
    } finally { setGerando(false); }
  };

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">
        <header className="mb-6">
          <h1 className="font-display text-3xl">Trabalho científico</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Preenche o formulário. O crédito (1 trabalho) só é descontado quando clicas em <strong>Gerar trabalho</strong>.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm">
            <FileText className="h-4 w-4 text-primary" />
            <span className="font-medium">{disponiveis}</span>
            <span className="text-muted-foreground">trabalho(s) disponível(eis)</span>
            {disponiveis === 0 && (
              <Link to="/app/planos" className="ml-2 text-primary underline">Comprar</Link>
            )}
          </div>
        </header>

        <section className="space-y-6 rounded-2xl border border-border bg-card p-5 md:p-6">
          <Bloco titulo="Dados do aluno">
            <Campo label="Nome completo *"><Input value={f.nome_completo} onChange={(e)=>upd("nome_completo",e.target.value)} /></Campo>
            <Campo label="Turma *"><Input value={f.turma} onChange={(e)=>upd("turma",e.target.value)} /></Campo>
            <Campo label="Número do aluno *"><Input value={f.numero_aluno} onChange={(e)=>upd("numero_aluno",e.target.value)} /></Campo>
          </Bloco>

          <Bloco titulo="Instituição">
            <Campo label="Nome da escola/instituição *"><Input value={f.escola} onChange={(e)=>upd("escola",e.target.value)} /></Campo>
            <Campo label="Curso ou disciplina *"><Input value={f.curso} onChange={(e)=>upd("curso",e.target.value)} /></Campo>
          </Bloco>

          <Bloco titulo="Orientador">
            <Campo label="Nome do orientador *"><Input value={f.orientador_nome} onChange={(e)=>upd("orientador_nome",e.target.value)} /></Campo>
            <Campo label="Cargo *"><Input value={f.orientador_cargo} onChange={(e)=>upd("orientador_cargo",e.target.value)} /></Campo>
          </Bloco>

          <Bloco titulo="Trabalho">
            <Campo label="Tema do trabalho *" className="md:col-span-2">
              <Textarea rows={2} value={f.tema} onChange={(e)=>upd("tema",e.target.value)} />
            </Campo>
            <Campo label="Nível académico *">
              <Select value={f.nivel_academico} onValueChange={(v)=>upd("nivel_academico", v as any)}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Médio">Médio</SelectItem>
                  <SelectItem value="Superior">Superior</SelectItem>
                </SelectContent>
              </Select>
            </Campo>
            <Campo label="Número de páginas (mín. 8) *">
              <Input type="number" min={8} value={f.paginas} onChange={(e)=>upd("paginas", Math.max(8, Number(e.target.value)||8))}/>
            </Campo>
            <Campo label="Formato de citação (referências bibliográficas) *" className="md:col-span-2">
              <Select value={f.formato_citacao} onValueChange={(v)=>upd("formato_citacao", v as any)}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="APA">APA</SelectItem>
                  <SelectItem value="ABNT">ABNT</SelectItem>
                  <SelectItem value="Vancouver">Vancouver</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">Define como serão apresentadas as fontes/referências no fim do trabalho.</p>
            </Campo>
          </Bloco>

          <Bloco titulo="Data">
            <Campo label="Mês *">
              <Select value={f.mes} onValueChange={(v)=>upd("mes", v)}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>{MESES.map(m=><SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </Campo>
            <Campo label="Ano *">
              <Input type="number" min={2024} value={f.ano} onChange={(e)=>upd("ano", Number(e.target.value)||ANO_ACTUAL)}/>
            </Campo>
            <Campo label="Cidade *"><Input value={f.cidade} onChange={(e)=>upd("cidade", e.target.value)}/></Campo>
          </Bloco>

          <Bloco titulo="Fonte do conteúdo">
            <div className="md:col-span-3 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={()=>setTipoFonte("internet")}
                className={`flex-1 rounded-xl border p-4 text-left transition-colors ${tipoFonte==="internet"?"border-primary bg-primary/5":"border-border hover:bg-muted"}`}
              >
                <div className="font-medium">🌐 Internet</div>
                <div className="mt-1 text-xs text-muted-foreground">A IA pesquisa e gera automaticamente.</div>
              </button>
              <button
                type="button"
                onClick={()=>setTipoFonte("anexo")}
                className={`flex-1 rounded-xl border p-4 text-left transition-colors ${tipoFonte==="anexo"?"border-primary bg-primary/5":"border-border hover:bg-muted"}`}
              >
                <div className="font-medium">📎 Anexar material</div>
                <div className="mt-1 text-xs text-muted-foreground">PDF / Word / Excel. Feito manualmente — até 6h.</div>
              </button>
            </div>

            {tipoFonte === "anexo" && (
              <div className="md:col-span-3 space-y-3">
                <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>Como o material é anexado, o trabalho será feito manualmente pelo administrador e entregue em até <strong>6 horas</strong>.</p>
                </div>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-6 text-center hover:bg-muted">
                  <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
                  <span className="text-sm font-medium">{uploading ? "A enviar…" : "Clica para anexar (PDF, Word, Excel)"}</span>
                  <span className="text-xs text-muted-foreground">Máx 20MB por ficheiro</span>
                  <input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx" className="hidden"
                    onChange={(e)=>{ handleFiles(e.target.files); e.target.value=""; }} disabled={uploading}/>
                </label>
                {anexos.length>0 && (
                  <ul className="space-y-1">
                    {anexos.map(a=>(
                      <li key={a.path} className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
                        <span className="truncate">{a.nome} <span className="text-muted-foreground">({(a.tamanho/1024/1024).toFixed(2)} MB)</span></span>
                        <button onClick={()=>removerAnexo(a.path)} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4"/></button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </Bloco>

          <div className="flex justify-end pt-2">
            <Button size="lg" onClick={submeter} disabled={gerando || disponiveis<=0}>
              {gerando ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
              {tipoFonte === "internet" ? "Gerar trabalho (−1 crédito)" : "Enviar ao ADM (−1 crédito)"}
            </Button>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 font-display text-xl">Os meus trabalhos</h2>
          {trabalhos.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Ainda não submeteste nenhum trabalho.
            </p>
          ) : (
            <ul className="space-y-2">
              {trabalhos.map((t:any)=>(
                <li key={t.id} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{t.titulo ?? (t.dados_formulario?.tema)}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                        <Badge variant="secondary">{t.tipo_fonte === "anexo" ? "📎 Anexo" : "🌐 Internet"}</Badge>
                        <Badge>{t.status}</Badge>
                        <span className="text-muted-foreground">{new Date(t.created_at).toLocaleString("pt-PT")}</span>
                      </div>
                    </div>
                    {t.ficheiro_url && (
                      <Button size="sm" variant="outline" onClick={()=>baixar(t.ficheiro_url)}>
                        <Download className="mr-1 h-4 w-4"/>Baixar
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">{children}</div>
    </div>
  );
}

function Campo({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="mb-1 block text-xs">{label}</Label>
      {children}
    </div>
  );
}

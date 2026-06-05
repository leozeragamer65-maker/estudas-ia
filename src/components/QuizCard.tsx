import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Check, X, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { responderQuiz } from "@/lib/quiz.functions";

interface Quiz {
  id: string;
  categoria: string;
  pergunta: string;
  opcoes: string[];
  resposta: null | { resposta: number; correta: boolean };
  resposta_correta: number | null;
  explicacao: string | null;
}

export function QuizCard({ quiz }: { quiz: Quiz }) {
  const responder = useServerFn(responderQuiz);
  const qc = useQueryClient();
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ correta: boolean; resposta_correta: number; explicacao: string } | null>(
    quiz.resposta && quiz.resposta_correta !== null && quiz.explicacao !== null
      ? { correta: quiz.resposta.correta, resposta_correta: quiz.resposta_correta, explicacao: quiz.explicacao }
      : null,
  );
  const minhaResp = quiz.resposta?.resposta ?? null;
  const respondido = !!resultado;

  const submeter = async (idx: number) => {
    if (respondido || enviando) return;
    setEnviando(true);
    try {
      const r = await responder({ data: { quiz_id: quiz.id, resposta: idx } });
      setResultado(r);
      qc.invalidateQueries({ queryKey: ["quiz-stats"] });
      qc.invalidateQueries({ queryKey: ["daily-quizzes"] });
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao responder");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-xs">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">{quiz.categoria}</span>
      </div>
      <div className="mt-3 font-medium">{quiz.pergunta}</div>
      <div className="mt-3 grid gap-2">
        {quiz.opcoes.map((op, i) => {
          const isMinha = minhaResp === i || (resultado && i === (minhaResp ?? -1));
          const isCorreta = respondido && resultado!.resposta_correta === i;
          const isErrada = respondido && isMinha && !resultado!.correta;
          return (
            <Button
              key={i}
              variant="outline"
              disabled={respondido || enviando}
              onClick={() => submeter(i)}
              className={`justify-start whitespace-normal text-left h-auto py-2 ${
                isCorreta ? "border-emerald-500 bg-emerald-500/10 text-foreground" : ""
              } ${isErrada ? "border-destructive bg-destructive/10 text-foreground" : ""}`}
            >
              <span className="mr-2 font-display text-sm text-muted-foreground">{String.fromCharCode(65 + i)}.</span>
              <span className="flex-1">{op}</span>
              {isCorreta && <Check className="ml-2 h-4 w-4 text-emerald-600" />}
              {isErrada && <X className="ml-2 h-4 w-4 text-destructive" />}
            </Button>
          );
        })}
      </div>
      {enviando && <Loader2 className="mt-3 h-4 w-4 animate-spin" />}
      {resultado && (
        <div className={`mt-4 rounded-lg p-3 text-sm ${resultado.correta ? "bg-emerald-500/10" : "bg-destructive/10"}`}>
          <div className="font-medium">{resultado.correta ? "✅ Resposta correta!" : "❌ Resposta errada."}</div>
          {resultado.explicacao && <div className="mt-1 text-muted-foreground">{resultado.explicacao}</div>}
        </div>
      )}
    </div>
  );
}

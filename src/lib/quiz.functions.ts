import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickDailyTwo<T extends { id: string }>(quizzes: T[], dia: string): T[] {
  if (quizzes.length <= 2) return quizzes;
  const scored = quizzes.map((q) => ({ q, s: hashStr(dia + q.id) })).sort((a, b) => a.s - b.s);
  return [scored[0].q, scored[1].q];
}

export const getDailyQuizzes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const dia = new Date().toISOString().slice(0, 10);
    const { data: all } = await supabase.from("quizzes").select("*");
    const dailyAll = pickDailyTwo(all ?? [], dia);
    const { data: respostas } = await supabase
      .from("quiz_respostas")
      .select("*")
      .eq("user_id", userId)
      .in(
        "quiz_id",
        dailyAll.map((q: any) => q.id),
      );
    const respMap = new Map((respostas ?? []).map((r: any) => [r.quiz_id, r]));
    return dailyAll.map((q: any) => ({
      id: q.id,
      categoria: q.categoria,
      pergunta: q.pergunta,
      opcoes: q.opcoes as string[],
      resposta: respMap.get(q.id) ?? null,
      resposta_correta: respMap.has(q.id) ? q.resposta_correta : null,
      explicacao: respMap.has(q.id) ? q.explicacao : null,
    }));
  });

export const responderQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({ quiz_id: z.string().uuid(), resposta: z.number().int().min(0).max(10) }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: quiz, error: e1 } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", data.quiz_id)
      .single();
    if (e1 || !quiz) throw new Error("Quiz não encontrado.");
    const correta = quiz.resposta_correta === data.resposta;
    const { error } = await supabase.from("quiz_respostas").insert({
      user_id: userId,
      quiz_id: data.quiz_id,
      resposta: data.resposta,
      correta,
    });
    if (error) {
      if (error.code === "23505") throw new Error("Já respondeste este quiz.");
      throw new Error(error.message);
    }
    return {
      correta,
      resposta_correta: quiz.resposta_correta,
      explicacao: quiz.explicacao,
    };
  });

export const getQuizStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase.from("quiz_respostas").select("correta").eq("user_id", userId);
    const total = data?.length ?? 0;
    const acertos = (data ?? []).filter((r: any) => r.correta).length;
    return { total, acertos, taxa: total > 0 ? Math.round((acertos / total) * 100) : 0 };
  });

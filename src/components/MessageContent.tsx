import { Fragment } from "react";
import { InlineMath, BlockMath } from "react-katex";

// Faz parse de blocos $$...$$ e $...$ e renderiza com KaTeX.
// O resto é texto simples com quebras de linha preservadas.
export function MessageContent({ text }: { text: string }) {
  const parts: { type: "text" | "inline" | "block"; value: string }[] = [];
  let i = 0;
  while (i < text.length) {
    const nextBlock = text.indexOf("$$", i);
    const nextInline = text.indexOf("$", i);
    let idx = -1;
    let kind: "inline" | "block" = "inline";
    if (nextBlock !== -1 && (nextInline === -1 || nextBlock <= nextInline)) {
      idx = nextBlock;
      kind = "block";
    } else if (nextInline !== -1) {
      idx = nextInline;
      kind = "inline";
    }
    if (idx === -1) {
      parts.push({ type: "text", value: text.slice(i) });
      break;
    }
    if (idx > i) parts.push({ type: "text", value: text.slice(i, idx) });
    const open = kind === "block" ? "$$" : "$";
    const close = text.indexOf(open, idx + open.length);
    if (close === -1) {
      parts.push({ type: "text", value: text.slice(i) });
      break;
    }
    const expr = text.slice(idx + open.length, close);
    parts.push({ type: kind, value: expr });
    i = close + open.length;
  }

  return (
    <div className="whitespace-pre-wrap break-words leading-relaxed">
      {parts.map((p, k) => {
        if (p.type === "text") return <Fragment key={k}>{p.value}</Fragment>;
        try {
          if (p.type === "block")
            return (
              <div key={k} className="my-2">
                <BlockMath math={p.value} />
              </div>
            );
          return <InlineMath key={k} math={p.value} />;
        } catch {
          return <code key={k}>{p.value}</code>;
        }
      })}
    </div>
  );
}

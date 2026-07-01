import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

// Detecta se o texto é (ou contém) HTML de gráfico Plotly / documento HTML completo
function detectPlotlyHtml(text: string): string | null {
  const t = text.trim();
  const looksHtml = /^<(!doctype|html|head|body|div)/i.test(t) || /<\/html>/i.test(t);
  const hasPlotly = /plotly|plotly-latest|Plotly\.newPlot/i.test(t);
  if (looksHtml && hasPlotly) return t;
  // Bloco ```html ... ``` contendo Plotly
  const fence = t.match(/```html\s*([\s\S]*?)```/i);
  if (fence && /plotly/i.test(fence[1])) return fence[1].trim();
  return null;
}

// Detecta imagem base64 (data URI ou string base64 pura de imagem)
function detectBase64Image(text: string): string | null {
  const t = text.trim();
  const dataUri = t.match(/data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,[A-Za-z0-9+/=]+/);
  if (dataUri) return dataUri[0];
  // Base64 pura muito longa sem espaços — heurística
  if (/^[A-Za-z0-9+/=\s]+$/.test(t) && t.length > 200 && !t.includes(" ")) {
    return `data:image/png;base64,${t.replace(/\s+/g, "")}`;
  }
  return null;
}

// Renderiza markdown + KaTeX; suporta também gráficos Plotly (HTML) e imagens base64.
export function MessageContent({ text }: { text: string }) {
  const plotly = detectPlotlyHtml(text);
  if (plotly) {
    return (
      <div className="my-2 overflow-hidden rounded-xl border border-border bg-white">
        <iframe
          title="Gráfico"
          sandbox="allow-scripts"
          srcDoc={plotly}
          className="h-[420px] w-full"
        />
      </div>
    );
  }

  const img = detectBase64Image(text);
  if (img) {
    return (
      <div className="my-2">
        <img
          src={img}
          alt="Resposta em imagem"
          className="max-w-full rounded-xl border border-border"
        />
      </div>
    );
  }

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none break-words leading-relaxed prose-p:my-2 prose-pre:my-2 prose-headings:mt-3 prose-headings:mb-1">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

// Correção de redação estimada pela IA (Pro, até 8 por mês). Não é nota oficial e a interface diz isso.
import Anthropic from "npm:@anthropic-ai/sdk@0.135.0";
import { SAFETY, guard, imageBlocks, parseOutput, validImages } from "../_shared/ai.ts";
import { adminClient, failure, json, preflight } from "../_shared/server.ts";

const THEME_MAX = 160;
const TEXT_MAX = 6000;

const SYSTEM = `${SAFETY}

Você estima a nota de uma redação dissertativo-argumentativa do Enem pela matriz oficial do Inep.
Avalie cada competência de 0 a 200, só em múltiplos de 40:
C1 domínio da norma culta da língua escrita;
C2 compreensão da proposta e aplicação de conceitos de várias áreas para desenvolver o tema, no tipo dissertativo-argumentativo;
C3 seleção, relação, organização e interpretação de informações, fatos, opiniões e argumentos em defesa de um ponto de vista;
C4 conhecimento dos mecanismos linguísticos necessários para a construção da argumentação (coesão);
C5 proposta de intervenção para o problema, que respeite os direitos humanos, com agente, ação, meio, efeito e detalhamento.
Fuga total ao tema, texto que não é dissertativo-argumentativo ou com até 7 linhas zera a redação: dê 0 em todas.
Seja exigente como um corretor do Enem, sem inflar notas. Em cada competência, explique em até 2 frases o que justificou a nota
e o que fazer para subir, citando trechos curtos da redação quando ajudar.
No resumo, diga em até 3 frases o que mais vale a pena treinar na próxima redação.
Se não conseguir ler a redação na foto, marque legible como false e deixe o resto vazio ou zerado.`;

const SCHEMA = {
  type: "object",
  properties: {
    legible: { type: "boolean" },
    scores: { type: "array", items: { type: "integer", enum: [0, 40, 80, 120, 160, 200] } },
    comments: { type: "array", items: { type: "string" } },
    summary: { type: "string" },
  },
  required: ["legible", "scores", "comments", "summary"],
  additionalProperties: false,
};

interface EssayOutput {
  legible: boolean;
  scores: number[];
  comments: string[];
  summary: string;
}

Deno.serve(async (request) => {
  const options = preflight(request);
  if (options) return options;

  const body = (await request.json().catch(() => ({}))) as { theme?: unknown; text?: unknown; images?: unknown };
  const theme = typeof body.theme === "string" ? body.theme.trim() : "";
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const images = validImages(body.images, 2);
  if (!theme || theme.length > THEME_MAX) return failure("Escreva o tema da redação.", 400);
  if (!images || text.length > TEXT_MAX) return failure("Envie até 2 fotos ou o texto da redação.", 400);
  if (!text && images.length === 0) return failure("Envie as fotos ou cole o texto da redação.", 400);

  const admin = adminClient();
  const access = await guard(request, admin, "redacao");
  if (access instanceof Response) return access;

  try {
    const client = new Anthropic();
    const message = await client.beta.messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: [
            ...imageBlocks(images),
            { type: "text", text: `Tema: ${theme}\n\n${text ? `Texto da redação:\n${text}` : "A redação está nas fotos acima."}` },
          ],
        },
      ],
    });
    const output = parseOutput<EssayOutput>(message);
    if (!output || output.scores.length !== 5 || output.comments.length !== 5) {
      await access.release();
      return failure("Não foi possível corrigir agora. Tente de novo.", 502);
    }
    if (!output.legible) {
      await access.release();
      return failure("Não deu para ler a redação. Tire as fotos com boa luz, de cima, ou cole o texto.", 422);
    }
    return json({ scores: output.scores, comments: output.comments, summary: output.summary, remaining: access.remaining });
  } catch {
    await access.release();
    return failure("Não foi possível corrigir agora. Tente de novo.", 502);
  }
});

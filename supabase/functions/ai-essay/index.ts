// CorreÃ§Ã£o de redaÃ§Ã£o estimada pela IA (Pro, atÃ© 8 por mÃªs). NÃ£o Ã© nota oficial e a interface diz isso.
import Anthropic from "npm:@anthropic-ai/sdk@0.135.0";
import { SAFETY, guard, imageBlocks, parseOutput, validImages } from "../_shared/ai.ts";
import { adminClient, failure, json, preflight } from "../_shared/server.ts";

const THEME_MAX = 160;
const TEXT_MAX = 6000;

const SYSTEM = `${SAFETY}

VocÃª estima a nota de uma redaÃ§Ã£o dissertativo-argumentativa do Enem pela matriz oficial do Inep.
Avalie cada competÃªncia de 0 a 200, sÃ³ em mÃºltiplos de 40:
C1 domÃ­nio da norma culta da lÃ­ngua escrita;
C2 compreensÃ£o da proposta e aplicaÃ§Ã£o de conceitos de vÃ¡rias Ã¡reas para desenvolver o tema, no tipo dissertativo-argumentativo;
C3 seleÃ§Ã£o, relaÃ§Ã£o, organizaÃ§Ã£o e interpretaÃ§Ã£o de informaÃ§Ãµes, fatos, opiniÃµes e argumentos em defesa de um ponto de vista;
C4 conhecimento dos mecanismos linguÃ­sticos necessÃ¡rios para a construÃ§Ã£o da argumentaÃ§Ã£o (coesÃ£o);
C5 proposta de intervenÃ§Ã£o para o problema, que respeite os direitos humanos, com agente, aÃ§Ã£o, meio, efeito e detalhamento.
Fuga total ao tema, texto que nÃ£o Ã© dissertativo-argumentativo ou com atÃ© 7 linhas zera a redaÃ§Ã£o: dÃª 0 em todas.
Seja exigente como um corretor do Enem, sem inflar notas. Em cada competÃªncia, explique em atÃ© 2 frases o que justificou a nota
e o que fazer para subir, citando trechos curtos da redaÃ§Ã£o quando ajudar.
No resumo, diga em atÃ© 3 frases o que mais vale a pena treinar na prÃ³xima redaÃ§Ã£o.
Se nÃ£o conseguir ler a redaÃ§Ã£o na foto, marque legible como false e deixe o resto vazio ou zerado.`;

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
  if (!theme || theme.length > THEME_MAX) return failure("Escreva o tema da redaÃ§Ã£o.", 400);
  if (!images || text.length > TEXT_MAX) return failure("Envie atÃ© 2 fotos ou o texto da redaÃ§Ã£o.", 400);
  if (!text && images.length === 0) return failure("Envie as fotos ou cole o texto da redaÃ§Ã£o.", 400);

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
            { type: "text", text: `Tema: ${theme}\n\n${text ? `Texto da redaÃ§Ã£o:\n${text}` : "A redaÃ§Ã£o estÃ¡ nas fotos acima."}` },
          ],
        },
      ],
    });
    const output = parseOutput<EssayOutput>(message);
    if (!output || output.scores.length !== 5 || output.comments.length !== 5) {
      await access.release();
      return failure("NÃ£o foi possÃ­vel corrigir agora. Tente de novo.", 502);
    }
    if (!output.legible) {
      await access.release();
      return failure("NÃ£o deu para ler a redaÃ§Ã£o. Tire as fotos com boa luz, de cima, ou cole o texto.", 422);
    }
    return json({ scores: output.scores, comments: output.comments, summary: output.summary, remaining: access.remaining });
  } catch {
    await access.release();
    return failure("NÃ£o foi possÃ­vel corrigir agora. Tente de novo.", 502);
  }
});

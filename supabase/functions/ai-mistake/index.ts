// AnÃ¡lise de uma questÃ£o errada pela IA (Pro, atÃ© 60 por mÃªs). O resultado sÃ³ preenche o formulÃ¡rio: a pessoa confere e salva.
import Anthropic from "npm:@anthropic-ai/sdk@0.135.0";
import { SAFETY, guard, imageBlocks, parseOutput, validImages } from "../_shared/ai.ts";
import { adminClient, failure, json, preflight } from "../_shared/server.ts";

const TEXT_MAX = 4000;
const LETTERS = ["A", "B", "C", "D", "E"];

const SYSTEM = `${SAFETY}

O estudante errou (ou acertou no chute) uma questÃ£o de mÃºltipla escolha no estilo do Enem e quer entender o erro.
Resolva a questÃ£o com cuidado antes de responder e diga a alternativa correta.
Explique a resoluÃ§Ã£o de forma curta e direta e aponte onde o raciocÃ­nio da alternativa marcada desviou.
Classifique o motivo mais provÃ¡vel do erro:
"conteudo" (nÃ£o sabia o conteÃºdo), "interpretacao" (nÃ£o entendeu o que o comando pedia),
"atencao" (pressa ou distraÃ§Ã£o: sabia, mas errou a conta ou a leitura) ou "chute".
Diga tambÃ©m o tÃ³pico da questÃ£o em poucas palavras, como o estudante anotaria (ex.: "Porcentagem", "Estequiometria").
Limites: question com atÃ© 250 caracteres (o que a questÃ£o pedia), lesson com atÃ© 450 caracteres (a resoluÃ§Ã£o e o desvio).
Se nÃ£o conseguir ler a questÃ£o, marque legible como false e deixe o resto vazio.`;

const SCHEMA = {
  type: "object",
  properties: {
    legible: { type: "boolean" },
    answer: { type: "string", enum: [...LETTERS, ""] },
    question: { type: "string" },
    lesson: { type: "string" },
    reason: { type: "string", enum: ["conteudo", "interpretacao", "atencao", "chute"] },
    topic: { type: "string" },
  },
  required: ["legible", "answer", "question", "lesson", "reason", "topic"],
  additionalProperties: false,
};

interface MistakeOutput {
  legible: boolean;
  answer: string;
  question: string;
  lesson: string;
  reason: string;
  topic: string;
}

Deno.serve(async (request) => {
  const options = preflight(request);
  if (options) return options;

  const body = (await request.json().catch(() => ({}))) as { text?: unknown; images?: unknown; marked?: unknown };
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const images = validImages(body.images, 1);
  const marked = typeof body.marked === "string" && LETTERS.includes(body.marked) ? body.marked : null;
  if (!images || text.length > TEXT_MAX) return failure("Envie uma foto ou o texto da questÃ£o.", 400);
  if (!text && images.length === 0) return failure("Envie a foto ou cole o texto da questÃ£o.", 400);

  const admin = adminClient();
  const access = await guard(request, admin, "erro");
  if (access instanceof Response) return access;

  try {
    const client = new Anthropic();
    const message = await client.messages.create({
      model: "claude-haiku-5-5",
      max_tokens: 16000,
      output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: [
            ...imageBlocks(images),
            {
              type: "text",
              text: `${text ? `QuestÃ£o:\n${text}\n\n` : ""}${marked ? `Alternativa que marquei: ${marked}.` : "NÃ£o lembro o que marquei."}`,
            },
          ],
        },
      ],
    });
    const output = parseOutput<MistakeOutput>(message);
    if (!output) {
      await access.release();
      return failure("NÃ£o foi possÃ­vel analisar agora. Tente de novo.", 502);
    }
    if (!output.legible) {
      await access.release();
      return failure("NÃ£o deu para ler a questÃ£o. Tire a foto com boa luz, de cima, ou cole o texto.", 422);
    }
    return json({
      answer: output.answer || null,
      question: output.question.slice(0, 300),
      lesson: output.lesson.slice(0, 500),
      reason: output.reason,
      topic: output.topic.slice(0, 80),
      remaining: access.remaining,
    });
  } catch {
    await access.release();
    return failure("NÃ£o foi possÃ­vel analisar agora. Tente de novo.", 502);
  }
});

// Análise de uma questão errada pela IA (Pro, até 60 por mês). O resultado só preenche o formulário: a pessoa confere e salva.
import Anthropic from "npm:@anthropic-ai/sdk@0.135.0";
import { SAFETY, guard, imageBlocks, parseOutput, validImages } from "../_shared/ai.ts";
import { adminClient, failure, json, preflight } from "../_shared/server.ts";

const TEXT_MAX = 4000;
const LETTERS = ["A", "B", "C", "D", "E"];

const SYSTEM = `${SAFETY}

O estudante errou (ou acertou no chute) uma questão de múltipla escolha no estilo do Enem e quer entender o erro.
Resolva a questão com cuidado antes de responder e diga a alternativa correta.
Explique a resolução de forma curta e direta e aponte onde o raciocínio da alternativa marcada desviou.
Classifique o motivo mais provável do erro:
"conteudo" (não sabia o conteúdo), "interpretacao" (não entendeu o que o comando pedia),
"atencao" (pressa ou distração: sabia, mas errou a conta ou a leitura) ou "chute".
Diga também o tópico da questão em poucas palavras, como o estudante anotaria (ex.: "Porcentagem", "Estequiometria").
Limites: question com até 250 caracteres (o que a questão pedia), lesson com até 450 caracteres (a resolução e o desvio).
Se não conseguir ler a questão, marque legible como false e deixe o resto vazio.`;

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
  if (!images || text.length > TEXT_MAX) return failure("Envie uma foto ou o texto da questão.", 400);
  if (!text && images.length === 0) return failure("Envie a foto ou cole o texto da questão.", 400);

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
              text: `${text ? `Questão:\n${text}\n\n` : ""}${marked ? `Alternativa que marquei: ${marked}.` : "Não lembro o que marquei."}`,
            },
          ],
        },
      ],
    });
    const output = parseOutput<MistakeOutput>(message);
    if (!output) {
      await access.release();
      return failure("Não foi possível analisar agora. Tente de novo.", 502);
    }
    if (!output.legible) {
      await access.release();
      return failure("Não deu para ler a questão. Tire a foto com boa luz, de cima, ou cole o texto.", 422);
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
    return failure("Não foi possível analisar agora. Tente de novo.", 502);
  }
});

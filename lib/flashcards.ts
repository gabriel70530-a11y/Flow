import { addDays } from "./dates";
import type { AreaId, SubjectId } from "./syllabus";

export const CARD_FRONT_MAX = 300;
export const CARD_BACK_MAX = 600;

export type CardGrade = "errei" | "dificil" | "bom" | "facil";

export const CARD_GRADES: { value: CardGrade; label: string }[] = [
  { value: "errei", label: "Errei" },
  { value: "dificil", label: "Difícil" },
  { value: "bom", label: "Bom" },
  { value: "facil", label: "Fácil" },
];

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  areaId: AreaId | null;
  subjectId: SubjectId | null;
  topicId: string | null;
  created: string;
  due: string;
  // Dias até a próxima vez; 0 enquanto o cartão ainda está sendo aprendido.
  interval: number;
  ease: number;
  reps: number;
  lapses: number;
}

export interface CardInput {
  front: string;
  back: string;
  areaId: AreaId | null;
  subjectId: SubjectId | null;
  topicId: string | null;
}

const START_EASE = 2.5;
const MIN_EASE = 1.3;

export function validateCard(input: CardInput): string | null {
  if (!input.front.trim()) return "Escreva a pergunta ou o termo da frente.";
  if (!input.back.trim()) return "Escreva a resposta do verso.";
  if (input.front.trim().length > CARD_FRONT_MAX) return `A frente pode ter até ${CARD_FRONT_MAX} caracteres.`;
  if (input.back.trim().length > CARD_BACK_MAX) return `O verso pode ter até ${CARD_BACK_MAX} caracteres.`;
  return null;
}

export function createCard(input: CardInput, id: string, today: string): Flashcard {
  return {
    id,
    front: input.front.trim(),
    back: input.back.trim(),
    areaId: input.areaId,
    subjectId: input.subjectId,
    topicId: input.topicId,
    created: today,
    due: today,
    interval: 0,
    ease: START_EASE,
    reps: 0,
    lapses: 0,
  };
}

export function editCard(card: Flashcard, input: CardInput): Flashcard {
  return { ...card, ...input, front: input.front.trim(), back: input.back.trim() };
}

// Próximo intervalo em dias, no estilo do Anki (SM-2): cada acerto multiplica o intervalo pela facilidade do cartão.
// "Errei" volta para hoje e recomeça; nunca some nada da fila.
function nextInterval(card: Flashcard, grade: CardGrade): number {
  if (grade === "errei") return 0;
  if (card.reps === 0) return grade === "facil" ? 4 : 1;
  if (grade === "dificil") return Math.max(1, Math.round(card.interval * 1.2));
  const base = card.reps === 1 && grade === "bom" ? 3 : card.interval * card.ease;
  return Math.max(card.interval + 1, Math.round(grade === "facil" ? base * 1.3 : base));
}

export function previewInterval(card: Flashcard, grade: CardGrade): number {
  return nextInterval(card, grade);
}

export function reviewCard(card: Flashcard, grade: CardGrade, today: string): Flashcard {
  const interval = nextInterval(card, grade);
  const easeChange = { errei: -0.2, dificil: -0.15, bom: 0, facil: 0.15 }[grade];
  return {
    ...card,
    interval,
    due: addDays(today, interval),
    ease: Math.max(MIN_EASE, Math.round((card.ease + easeChange) * 100) / 100),
    reps: grade === "errei" ? 0 : card.reps + 1,
    lapses: grade === "errei" ? card.lapses + 1 : card.lapses,
  };
}

export function intervalLabel(days: number): string {
  if (days === 0) return "hoje";
  if (days < 30) return `${days} d`;
  if (days < 365) return `${Math.round(days / 30)} m`;
  return `${Math.round((days / 365) * 10) / 10} a`.replace(".", ",");
}

export function dueCards(cards: readonly Flashcard[], today: string): Flashcard[] {
  return cards.filter((card) => card.due <= today).sort((first, second) => first.due.localeCompare(second.due));
}

// Novo: nunca respondido. Aprendendo: intervalo curto. Maduro: 21 dias ou mais, como no Anki.
export function cardCounts(cards: readonly Flashcard[]): { total: number; fresh: number; learning: number; mature: number } {
  return {
    total: cards.length,
    fresh: cards.filter((card) => card.reps === 0 && card.lapses === 0).length,
    learning: cards.filter((card) => (card.reps > 0 || card.lapses > 0) && card.interval < 21).length,
    mature: cards.filter((card) => card.interval >= 21).length,
  };
}

export const IMPORT_MAX = 2000;

export interface ImportedCards {
  cards: { front: string; back: string }[];
  skipped: number;
}

const SEPARATORS: Record<string, string> = { tab: "\t", comma: ",", semicolon: ";", pipe: "|", space: " ", colon: ":" };

const ENTITIES: Record<string, string> = { nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>|<\/(div|p|li)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\[sound:[^\]]*\]/g, "")
    .replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (entity, code: string) => {
      if (code.startsWith("#x") || code.startsWith("#X")) return String.fromCodePoint(parseInt(code.slice(2), 16));
      if (code.startsWith("#")) return String.fromCodePoint(Number(code.slice(1)));
      return ENTITIES[code.toLowerCase()] ?? entity;
    })
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Campos separados, com aspas para o que tem separador ou quebra de linha dentro ("" é uma aspa), como o Anki exporta.
function splitRows(text: string, separator: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index++;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"' && field === "") quoted = true;
    else if (char === separator) {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") field += char;
  }
  if (field || row.length) rows.push([...row, field]);
  return rows;
}

// Lê o arquivo de texto que o Anki exporta em "Notas em texto simples" (.txt): cabeçalhos "#chave:valor", depois uma
// nota por linha. Frente e verso são os dois primeiros campos que não são guid, tipo de nota, baralho ou etiquetas.
export function parseAnkiText(text: string): ImportedCards {
  const headers = new Map<string, string>();
  const lines = text.replace(/^\uFEFF/, "").split("\n");
  while (lines.length && lines[0].startsWith("#") && lines[0].includes(":")) {
    const line = lines.shift()!.slice(1).trim();
    const colon = line.indexOf(":");
    headers.set(line.slice(0, colon).trim().toLowerCase(), line.slice(colon + 1).trim());
  }
  const body = lines.join("\n");
  const named = headers.get("separator")?.toLowerCase();
  const separator =
    (named && (SEPARATORS[named] ?? named)) || (body.includes("\t") ? "\t" : body.includes(";") ? ";" : ",");
  const html = headers.get("html")?.toLowerCase() !== "false";
  const metaColumns = new Set(
    ["guid column", "notetype column", "deck column", "tags column"]
      .map((key) => Number(headers.get(key)) - 1)
      .filter((index) => index >= 0),
  );

  const cards: ImportedCards["cards"] = [];
  let skipped = 0;
  for (const row of splitRows(body, separator)) {
    if (row.every((field) => !field.trim())) continue;
    const fields = row.filter((_, index) => !metaColumns.has(index)).map((field) => (html ? htmlToText(field) : field.trim()));
    const [front = "", back = ""] = fields;
    if (!front || !back || front.length > CARD_FRONT_MAX || back.length > CARD_BACK_MAX || cards.length >= IMPORT_MAX) {
      skipped++;
      continue;
    }
    cards.push({ front, back });
  }
  return { cards, skipped };
}

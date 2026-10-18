import type { Essay, RepertoireItem } from "./essays";
import type { Mistake } from "./mistakes";
import type { MockExam } from "./mock-exams";
import type { PlanTask, PlannerSettings } from "./planner";
import type { ProgressMap } from "./reviews";
import type { StudySession } from "./sessions";
import type { WeeklyGoal } from "./stats";
import type { TopicRecord } from "./topics";

// O que vai para a nuvem. Tema, som, consentimento de métricas e o timer são de cada aparelho.
export interface SyncedData {
  topics: TopicRecord[];
  progress: ProgressMap;
  sessions: StudySession[];
  tasks: PlanTask[];
  mistakes: Mistake[];
  mockExams: MockExam[];
  essays: Essay[];
  repertoire: RepertoireItem[];
  examChecklist: string[];
  goal: WeeklyGoal;
  planner: PlannerSettings;
  onboarding: { status: "pendente" | "concluido" | "pulado"; planMode: "sugerido" | "manual" };
  showStreak: boolean;
}

const LIST_COLLECTIONS = ["topics", "sessions", "tasks", "mistakes", "mockExams", "essays", "repertoire"] as const;
const SETTINGS = ["examChecklist", "goal", "planner", "onboarding", "showStreak"] as const;

type ListCollection = (typeof LIST_COLLECTIONS)[number];
type Setting = (typeof SETTINGS)[number];
export type Collection = ListCollection | "progress" | "ajustes";

export const COLLECTIONS: readonly Collection[] = [...LIST_COLLECTIONS, "progress", "ajustes"];

// Valor de cada registro em JSON com chaves ordenadas: o banco (jsonb) devolve as chaves em outra ordem.
export type RecordMap = Record<string, string>;

// Último valor confirmado pela nuvem, só como hash: guardar o JSON dobraria o espaço usado no localStorage.
export type BaseMap = Record<string, string>;

// Mudanças locais ainda não confirmadas pela nuvem. value null = registro apagado.
export type Outbox = Record<string, { value: unknown; changedAt: string }>;

export interface RemoteRecord {
  collection: Collection;
  id: string;
  data: unknown;
  deleted: boolean;
  updatedAt: string;
}

export interface SyncState {
  base: BaseMap;
  outbox: Outbox;
}

// No primeiro envio, o que já está na conta vence o que está no aparelho quando os dois têm o mesmo registro.
export const FIRST_SYNC_TIME = new Date(0).toISOString();

export function recordKey(collection: Collection, id: string): string {
  return `${collection}:${id}`;
}

export function parseKey(key: string): { collection: Collection; id: string } {
  const separator = key.indexOf(":");
  return { collection: key.slice(0, separator) as Collection, id: key.slice(separator + 1) };
}

export function stableJson(value: unknown): string {
  return JSON.stringify(value, (_key, item: unknown) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(Object.entries(item).sort(([first], [second]) => (first < second ? -1 : first > second ? 1 : 0)))
      : item,
  );
}

// cyrb53: hash rápido de 53 bits, suficiente para saber se um registro mudou.
export function hashJson(text: string): string {
  let first = 0xdeadbeef;
  let second = 0x41c6ce57;
  for (let index = 0; index < text.length; index++) {
    const code = text.charCodeAt(index);
    first = Math.imul(first ^ code, 2654435761);
    second = Math.imul(second ^ code, 1597334677);
  }
  first = Math.imul(first ^ (first >>> 16), 2246822507) ^ Math.imul(second ^ (second >>> 13), 3266489909);
  second = Math.imul(second ^ (second >>> 16), 2246822507) ^ Math.imul(first ^ (first >>> 13), 3266489909);
  return (4294967296 * (2097151 & second) + (first >>> 0)).toString(36);
}

export function toBase(current: RecordMap): BaseMap {
  return Object.fromEntries(Object.entries(current).map(([key, json]) => [key, hashJson(json)]));
}

export function toRecordMap(data: SyncedData): RecordMap {
  const map: RecordMap = {};
  for (const collection of LIST_COLLECTIONS) {
    for (const item of data[collection]) map[recordKey(collection, item.id)] = stableJson(item);
  }
  for (const [topicId, progress] of Object.entries(data.progress)) map[recordKey("progress", topicId)] = stableJson(progress);
  for (const setting of SETTINGS) map[recordKey("ajustes", setting)] = stableJson(data[setting]);
  return map;
}

function isListCollection(collection: Collection): collection is ListCollection {
  return (LIST_COLLECTIONS as readonly string[]).includes(collection);
}

function isSetting(id: string): id is Setting {
  return (SETTINGS as readonly string[]).includes(id);
}

// Grava ou apaga (value null) um registro. Itens novos entram no fim da lista.
export function setRecord<T extends SyncedData>(data: T, collection: Collection, id: string, value: unknown): T {
  if (isListCollection(collection)) {
    const list = data[collection] as { id: string }[];
    const exists = list.some((item) => item.id === id);
    const next =
      value === null
        ? list.filter((item) => item.id !== id)
        : exists
          ? list.map((item) => (item.id === id ? (value as { id: string }) : item))
          : [...list, value as { id: string }];
    return { ...data, [collection]: next };
  }
  if (collection === "progress") {
    const progress = { ...data.progress };
    if (value === null) delete progress[id];
    else progress[id] = value as ProgressMap[string];
    return { ...data, progress };
  }
  // Ajustes nunca são apagados; um registro desconhecido (de uma versão mais nova do app) é ignorado.
  if (collection === "ajustes" && isSetting(id) && value !== null) return { ...data, [id]: value };
  return data;
}

function valueOf(current: RecordMap, key: string): unknown {
  return key in current ? JSON.parse(current[key]) : null;
}

// Compara o estado atual com o último confirmado pela nuvem e registra o que mudou desde então.
export function collectChanges(base: BaseMap, current: RecordMap, outbox: Outbox, now: string): Outbox {
  const next: Outbox = {};
  for (const key of new Set([...Object.keys(base), ...Object.keys(current)])) {
    if (key in current ? base[key] === hashJson(current[key]) : !(key in base)) continue;
    const pending = outbox[key];
    const unchanged = pending && stableJson(pending.value) === (current[key] ?? "null");
    next[key] = unchanged ? pending : { value: valueOf(current, key), changedAt: now };
  }
  return next;
}

// Tudo o que está no aparelho vira mudança a enviar, sem passar por cima do que já está na conta.
export function firstSyncOutbox(current: RecordMap): Outbox {
  return Object.fromEntries(
    Object.keys(current).map((key) => [key, { value: valueOf(current, key), changedAt: FIRST_SYNC_TIME }]),
  );
}

/*
 * Aplica o que veio da nuvem. Em conflito vence a mudança mais recente: uma edição local pendente feita
 * depois da remota fica para ser enviada; uma mais antiga é descartada. Em empate, vence a nuvem.
 * O que já está igual ao aparelho não é reaplicado: sem mudança, devolve o mesmo objeto.
 */
export function mergeRemote<T extends SyncedData>(data: T, sync: SyncState, remote: readonly RemoteRecord[]): { data: T } & SyncState {
  let merged = data;
  const base = { ...sync.base };
  const outbox = { ...sync.outbox };
  for (const record of remote) {
    const key = recordKey(record.collection, record.id);
    const value = record.deleted ? null : record.data;
    const hash = value === null ? undefined : hashJson(stableJson(value));
    const pending = outbox[key];
    if (!pending && base[key] === hash) continue;
    if (hash === undefined) delete base[key];
    else base[key] = hash;
    if (pending && pending.changedAt > record.updatedAt) continue;
    delete outbox[key];
    merged = setRecord(merged, record.collection, record.id, value);
  }
  return { data: merged, base, outbox };
}

// Depois de enviar, o que foi aceito passa a ser a base. Mudanças feitas durante o envio continuam pendentes.
export function confirmPushed(sync: SyncState, pushed: Outbox): SyncState {
  const base = { ...sync.base };
  const outbox = { ...sync.outbox };
  for (const [key, change] of Object.entries(pushed)) {
    if (change.value === null) delete base[key];
    else base[key] = hashJson(stableJson(change.value));
    if (outbox[key] && outbox[key].changedAt === change.changedAt) delete outbox[key];
  }
  return { base, outbox };
}

export function toRemoteRecords(outbox: Outbox): RemoteRecord[] {
  return Object.entries(outbox).map(([key, change]) => {
    const { collection, id } = parseKey(key);
    return { collection, id, data: change.value, deleted: change.value === null, updatedAt: change.changedAt };
  });
}

import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import { create } from "zustand";
import {
  collectChanges,
  confirmPushed,
  firstSyncOutbox,
  mergeRemote,
  toRecordMap,
  toRemoteRecords,
  type Collection,
  type Outbox,
  type RemoteRecord,
  type SyncState,
  type SyncedData,
} from "@/lib/sync";
import { emptyData, type StudyData } from "./state";
import { useStudyStore } from "./study-store";

export type SyncStatus = "ocioso" | "sincronizando" | "offline" | "erro";

interface CloudState {
  available: boolean;
  email: string | null;
  // Aberto pelo link de "Esqueci minha senha": a interface pede a senha nova.
  recovering: boolean;
  status: SyncStatus;
  lastSyncedAt: number | null;
}

export const useCloud = create<CloudState>(() => ({
  available: cloudConfig() !== null,
  email: null,
  recovering: false,
  status: "ocioso",
  lastSyncedAt: null,
}));

interface SyncMeta extends SyncState {
  cursor: string | null;
}

const OWNER_KEY = "enem-flow:conta";
const metaKey = (userId: string) => `enem-flow:v2:sync:${userId}`;
const PAGE_SIZE = 1000;
const PUSH_CHUNK = 500;
// Gravações que terminam quase juntas podem chegar fora de ordem; reler um minuto evita perder alguma.
const CURSOR_OVERLAP_MS = 60_000;
const CHANGE_DELAY_MS = 4_000;
const PULL_INTERVAL_MS = 120_000;

function cloudConfig(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key && /^https:\/\//.test(url) ? { url, key } : null;
}

let supabase: SupabaseClient | null = null;

function client(): SupabaseClient | null {
  const config = cloudConfig();
  if (!config || typeof window === "undefined") return null;
  supabase ??= createClient(config.url, config.key, {
    auth: { flowType: "pkce", detectSessionInUrl: true, persistSession: true, storageKey: "enem-flow:sessao" },
  });
  return supabase;
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

const SYNCED_FIELDS = [
  "topics", "progress", "sessions", "tasks", "mistakes", "mockExams", "essays", "repertoire",
  "examChecklist", "goal", "planner", "onboarding", "showStreak",
] as const satisfies readonly (keyof SyncedData)[];

function syncedPart(data: StudyData): SyncedData {
  const { topics, progress, sessions, tasks, mistakes, mockExams, essays, repertoire, examChecklist, goal, planner, onboarding, showStreak } = data;
  return { topics, progress, sessions, tasks, mistakes, mockExams, essays, repertoire, examChecklist, goal, planner, onboarding, showStreak };
}

// Deixa o aparelho só com as preferências dele; o resto vem da conta.
function clearedData(data: StudyData): StudyData {
  return { ...data, ...syncedPart(emptyData()), demo: false };
}

function redirectUrl(): string {
  return `${window.location.origin}/ajustes`;
}

let currentUser: string | null = null;
let running: Promise<void> | null = null;
let again = false;

async function pullSince(db: SupabaseClient, cursor: string | null): Promise<{ records: RemoteRecord[]; cursor: string | null }> {
  const since = cursor ? new Date(Date.parse(cursor) - CURSOR_OVERLAP_MS).toISOString() : null;
  const records: RemoteRecord[] = [];
  let latest = cursor;
  for (let page = 0; ; page++) {
    let query = db.from("records").select("collection, id, data, deleted, updated_at, synced_at").order("synced_at");
    if (since) query = query.gt("synced_at", since);
    const { data, error } = await query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (error) throw error;
    for (const row of data) {
      records.push({ collection: row.collection as Collection, id: row.id, data: row.data, deleted: row.deleted, updatedAt: row.updated_at });
      latest = row.synced_at;
    }
    if (data.length < PAGE_SIZE) return { records, cursor: latest };
  }
}

async function pushChanges(db: SupabaseClient, outbox: Outbox) {
  const rows = toRemoteRecords(outbox).map(({ collection, id, data, deleted, updatedAt }) => ({
    collection,
    id,
    data,
    deleted,
    updated_at: updatedAt,
  }));
  for (let start = 0; start < rows.length; start += PUSH_CHUNK) {
    const { error } = await db.rpc("push_records", { changes: rows.slice(start, start + PUSH_CHUNK) });
    if (error) throw error;
  }
}

async function runSync(db: SupabaseClient, userId: string) {
  const saved = readJson<SyncMeta>(metaKey(userId));
  const { demo } = useStudyStore.getState();
  // Dados de exemplo nunca vão para a nuvem.
  let meta: SyncMeta = saved ?? {
    base: {},
    outbox: demo ? {} : firstSyncOutbox(toRecordMap(syncedPart(useStudyStore.getState()))),
    cursor: null,
  };

  const pulled = await pullSince(db, meta.cursor);

  // Sem await daqui até o set: nada muda na store entre reler o aparelho e aplicar o que veio da nuvem.
  let local = useStudyStore.getState() as StudyData;
  if (local.demo && pulled.records.length > 0) local = clearedData(local);
  const outbox = local.demo ? {} : collectChanges(meta.base, toRecordMap(syncedPart(local)), meta.outbox, new Date().toISOString());
  const part = syncedPart(local);
  const merged = mergeRemote(part, { base: meta.base, outbox }, pulled.records);
  if (merged.data !== part || local !== useStudyStore.getState()) useStudyStore.setState({ ...merged.data, demo: local.demo });
  meta = { base: merged.base, outbox: merged.outbox, cursor: pulled.cursor };
  writeJson(metaKey(userId), meta);

  const pushed = meta.outbox;
  if (Object.keys(pushed).length > 0) {
    await pushChanges(db, pushed);
    meta = { ...meta, ...confirmPushed(meta, pushed) };
    writeJson(metaKey(userId), meta);
  }
}

// Uma sincronização por vez; pedidos feitos durante ela viram uma nova rodada no fim.
export function syncNow(): Promise<void> {
  const db = client();
  const userId = currentUser;
  if (!db || !userId) return Promise.resolve();
  if (running) {
    again = true;
    return running;
  }
  useCloud.setState({ status: "sincronizando" });
  running = runSync(db, userId)
    .then(() => useCloud.setState({ status: "ocioso", lastSyncedAt: Date.now() }))
    .catch(() => useCloud.setState({ status: navigator.onLine ? "erro" : "offline" }))
    .finally(() => {
      running = null;
      if (again) {
        again = false;
        void syncNow();
      }
    });
  return running;
}

function applySession(session: Session | null) {
  const user = session?.user ?? null;
  const previous = currentUser;
  currentUser = user?.id ?? null;
  useCloud.setState({
    email: user?.email ?? null,
    ...(user ? {} : { status: "ocioso", lastSyncedAt: null }),
  });
  if (!user || user.id === previous) return;
  // Outra conta entrou neste aparelho: os dados da conta anterior não se misturam com os dela.
  const owner = readJson<string>(OWNER_KEY);
  if (owner && owner !== user.id && !readJson(metaKey(user.id))) {
    useStudyStore.setState(clearedData(useStudyStore.getState()));
  }
  writeJson(OWNER_KEY, user.id);
  void syncNow();
}

let started = false;

// Chamado uma vez pelo AppShell: escuta o login, sincroniza ao mudar algo, ao voltar a internet e de tempos em tempos.
export function startCloud(): () => void {
  const db = client();
  if (!db || started) return () => {};
  started = true;
  const { data } = db.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY") useCloud.setState({ recovering: true });
    applySession(session);
  });

  let timeout: ReturnType<typeof setTimeout> | undefined;
  const unsubscribeStore = useStudyStore.subscribe((state, previous) => {
    if (!currentUser || SYNCED_FIELDS.every((field) => state[field] === previous[field])) return;
    clearTimeout(timeout);
    timeout = setTimeout(() => void syncNow(), CHANGE_DELAY_MS);
  });
  const onVisible = () => {
    if (document.visibilityState === "visible") void syncNow();
  };
  const onOnline = () => void syncNow();
  const interval = setInterval(() => {
    if (document.visibilityState === "visible") void syncNow();
  }, PULL_INTERVAL_MS);
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("online", onOnline);

  return () => {
    started = false;
    data.subscription.unsubscribe();
    unsubscribeStore();
    clearTimeout(timeout);
    clearInterval(interval);
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("online", onOnline);
  };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_MIN = 8;

type AuthError = { code?: string; status?: number } | null;

function authMessage(error: AuthError, fallback: string): string | null {
  if (!error) return null;
  if (error.status === 429 || error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit") {
    return "Muitas tentativas seguidas. Espere um minuto e tente de novo.";
  }
  if (error.code === "invalid_credentials") return "E-mail ou senha incorretos.";
  if (error.code === "user_already_exists") return "Este e-mail já tem conta. Entre com sua senha ou use \"Esqueci minha senha\".";
  if (error.code === "email_not_confirmed")return "Confirme seu e-mail pelo link que enviamos antes de entrar.";
  if (error.code === "weak_password") return `Use uma senha mais forte, com pelo menos ${PASSWORD_MIN} caracteres.`;
  if (error.code === "same_password") return "A senha nova precisa ser diferente da atual.";
  return fallback;
}

function checkCredentials(email: string, password: string): string | null {
  if (!EMAIL_PATTERN.test(email.trim())) return "Confira o e-mail.";
  if (password.length < PASSWORD_MIN) return `A senha precisa ter pelo menos ${PASSWORD_MIN} caracteres.`;
  return null;
}

export async function signIn(email: string, password: string): Promise<string | null> {
  const db = client();
  if (!db) return "A conta ainda não está disponível.";
  if (!EMAIL_PATTERN.test(email.trim())) return "Confira o e-mail.";
  if (!password) return "Digite a senha.";
  const { error } = await db.auth.signInWithPassword({ email: email.trim(), password });
  return authMessage(error, "Não foi possível entrar agora. Tente de novo.");
}

// Com a confirmação de e-mail ligada, o Supabase não diz se o e-mail já tinha conta: a tela pede para conferir o e-mail nos dois casos.
export async function signUp(email: string, password: string): Promise<string | null> {
  const db = client();
  if (!db) return "A conta ainda não está disponível.";
  const invalid = checkCredentials(email, password);
  if (invalid) return invalid;
  const { error } = await db.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: redirectUrl() } });
  return authMessage(error, "Não foi possível criar a conta agora. Tente de novo.");
}

export async function resendConfirmation(email: string): Promise<string | null> {
  const db = client();
  if (!db) return "A conta ainda não está disponível.";
  const { error } = await db.auth.resend({ type: "signup", email: email.trim(), options: { emailRedirectTo: redirectUrl() } });
  return authMessage(error, "Não foi possível enviar de novo. Tente daqui a pouco.");
}

export async function sendPasswordReset(email: string): Promise<string | null> {
  const db = client();
  if (!db) return "A conta ainda não está disponível.";
  if (!EMAIL_PATTERN.test(email.trim())) return "Confira o e-mail.";
  const { error } = await db.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirectUrl() });
  return authMessage(error, "Não foi possível enviar o link. Tente de novo.");
}

export async function updatePassword(password: string): Promise<string | null> {
  const db = client();
  if (!db) return "A conta ainda não está disponível.";
  if (password.length < PASSWORD_MIN) return `A senha precisa ter pelo menos ${PASSWORD_MIN} caracteres.`;
  const { error } = await db.auth.updateUser({ password });
  if (!error) useCloud.setState({ recovering: false });
  return authMessage(error, "Não foi possível salvar a senha. Tente de novo.");
}

export function cancelRecovery() {
  useCloud.setState({ recovering: false });
}
// Envia o que falta antes de sair. Os dados continuam no aparelho.
export async function signOut() {
  const db = client();
  if (!db) return;
  await syncNow();
  await db.auth.signOut({ scope: "local" });
}

export async function deleteAccount(): Promise<string | null> {
  const db = client();
  const userId = currentUser;
  if (!db || !userId) return "Entre na conta para excluí-la.";
  const { error } = await db.rpc("delete_account");
  if (error) return "Não foi possível excluir a conta agora. Tente de novo.";
  try {
    localStorage.removeItem(metaKey(userId));
    localStorage.removeItem(OWNER_KEY);
  } catch {}
  await db.auth.signOut({ scope: "local" });
  return null;
}

// Partes comuns das funções do Flow (Supabase Edge Functions, Deno).
import { createClient, type SupabaseClient, type User } from "npm:@supabase/supabase-js@2.118.0";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
}

export function failure(message: string, status: number): Response {
  return json({ error: message }, status);
}

export function preflight(request: Request): Response | null {
  return request.method === "OPTIONS" ? new Response("ok", { headers: CORS_HEADERS }) : null;
}

export function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Variável ${name} não configurada.`);
  return value;
}

// Cliente com a chave de serviço: ignora o RLS. Só roda aqui no servidor, nunca no navegador.
export function adminClient(): SupabaseClient {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
}

export async function requireUser(request: Request, admin: SupabaseClient): Promise<User | null> {
  const token = request.headers.get("Authorization")?.replace(/^Bearer /, "");
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  return error ? null : data.user;
}

// Com PRO_TRIAL=true (o mesmo teste aberto do app), todos têm o Pro.
export async function hasPro(admin: SupabaseClient, userId: string): Promise<boolean> {
  if (Deno.env.get("PRO_TRIAL") === "true") return true;
  const { data } = await admin.from("entitlements").select("pro_until").eq("user_id", userId).maybeSingle();
  return data !== null && Date.parse(data.pro_until) > Date.now();
}

export function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * 86_400_000);
}

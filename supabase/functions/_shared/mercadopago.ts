import { env } from "./server.ts";

const API = "https://api.mercadopago.com";

export const PRICES = { mensal: 14.9, anual: 119.9 } as const;
export type BillingPlan = keyof typeof PRICES;

export async function mercadoPago<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${env("MP_ACCESS_TOKEN")}`,
      "Content-Type": "application/json",
      ...(init.method && init.method !== "GET" ? { "X-Idempotency-Key": crypto.randomUUID() } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (!response.ok) {
    // O motivo vem no corpo (ex.: e-mail do pagador recusado) e só aparece nos logs da função, nunca para a pessoa.
    console.error(`Mercado Pago respondeu ${response.status} em ${path}: ${await response.text()}`);
    throw new Error(`Mercado Pago respondeu ${response.status} em ${path}.`);
  }
  return (await response.json()) as T;
}

// external_reference guarda o plano e a conta: "mensal:<id>" ou "anual:<id>".
export function referenceFor(plan: BillingPlan, userId: string): string {
  return `${plan}:${userId}`;
}

export function parseReference(reference: string | null | undefined): { plan: BillingPlan; userId: string } | null {
  const match = /^(mensal|anual):([0-9a-f-]{36})$/.exec(reference ?? "");
  return match ? { plan: match[1] as BillingPlan, userId: match[2] } : null;
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function sameText(first: string, second: string): boolean {
  if (first.length !== second.length) return false;
  let difference = 0;
  for (let index = 0; index < first.length; index++) difference |= first.charCodeAt(index) ^ second.charCodeAt(index);
  return difference === 0;
}

// Confere o cabeçalho x-signature ("ts=...,v1=...") com a chave secreta do webhook, como manda a documentação do Mercado Pago.
export async function validSignature(request: Request, dataId: string): Promise<boolean> {
  const header = request.headers.get("x-signature") ?? "";
  const parts = Object.fromEntries(header.split(",").map((part) => part.trim().split("=", 2) as [string, string]));
  if (!parts.ts || !parts.v1) return false;
  const requestId = request.headers.get("x-request-id");
  const manifest = [
    dataId ? `id:${dataId.toLowerCase()};` : "",
    requestId ? `request-id:${requestId};` : "",
    `ts:${parts.ts};`,
  ].join("");
  return sameText(await hmacHex(env("MP_WEBHOOK_SECRET"), manifest), parts.v1);
}

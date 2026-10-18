// Recebe os avisos do Mercado Pago (publicado com --no-verify-jwt: quem chama Ã© o Mercado Pago, nÃ£o o app).
// Nunca confia no corpo do aviso: confere a assinatura e consulta o pagamento na API antes de liberar o Pro.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.118.0";
import { mercadoPago, parseReference, validSignature, type BillingPlan } from "../_shared/mercadopago.ts";
import { addDays, adminClient, failure, json } from "../_shared/server.ts";

// Folga depois da data da prÃ³xima cobranÃ§a, para tentativas de cobranÃ§a nÃ£o cortarem o Pro de quem estÃ¡ em dia.
const GRACE_DAYS = 3;

interface Payment {
  id: number;
  status: string;
  external_reference: string | null;
  transaction_amount: number;
}

interface AuthorizedPayment {
  preapproval_id: string;
  payment?: { id: number; status: string };
  transaction_amount: number;
}

interface Preapproval {
  id: string;
  status: string;
  external_reference: string | null;
  next_payment_date?: string;
}

// Registra o pagamento uma vez sÃ³. Devolve false se ele jÃ¡ tinha sido aplicado (aviso repetido).
async function recordPayment(admin: SupabaseClient, paymentId: string, userId: string, plan: BillingPlan, amount: number) {
  const { error } = await admin.from("payments").insert({ provider_payment_id: paymentId, user_id: userId, plan, amount });
  if (error?.code === "23505") return false;
  if (error) throw error;
  return true;
}

async function currentUntil(admin: SupabaseClient, userId: string): Promise<Date> {
  const { data } = await admin.from("entitlements").select("pro_until").eq("user_id", userId).maybeSingle();
  const until = data ? new Date(data.pro_until) : new Date(0);
  return until.getTime() > Date.now() ? until : new Date();
}

async function grant(admin: SupabaseClient, userId: string, plan: BillingPlan, proUntil: Date, providerRef: string) {
  const { error } = await admin.from("entitlements").upsert({
    user_id: userId,
    plan,
    status: "ativa",
    pro_until: proUntil.toISOString(),
    provider_ref: providerRef,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

async function onPayment(admin: SupabaseClient, id: string) {
  const payment = await mercadoPago<Payment>(`/v1/payments/${id}`);
  const reference = parseReference(payment.external_reference);
  // As cobranÃ§as da assinatura mensal chegam pelo aviso subscription_authorized_payment.
  if (payment.status !== "approved" || reference?.plan !== "anual") return;
  if (!(await recordPayment(admin, String(payment.id), reference.userId, "anual", payment.transaction_amount))) return;
  const from = await currentUntil(admin, reference.userId);
  await grant(admin, reference.userId, "anual", addDays(from, 365), String(payment.id));
}

async function onAuthorizedPayment(admin: SupabaseClient, id: string) {
  const charge = await mercadoPago<AuthorizedPayment>(`/authorized_payments/${id}`);
  if (charge.payment?.status !== "approved") return;
  const subscription = await mercadoPago<Preapproval>(`/preapproval/${charge.preapproval_id}`);
  const reference = parseReference(subscription.external_reference);
  if (reference?.plan !== "mensal") return;
  if (!(await recordPayment(admin, String(charge.payment.id), reference.userId, "mensal", charge.transaction_amount))) return;
  const from = await currentUntil(admin, reference.userId);
  const next = subscription.next_payment_date ? new Date(subscription.next_payment_date) : addDays(from, 30);
  const until = addDays(next.getTime() > from.getTime() ? next : addDays(from, 30), GRACE_DAYS);
  await grant(admin, reference.userId, "mensal", until, subscription.id);
}

// Cancelada ou pausada no Mercado Pago: o Pro continua atÃ© o fim do perÃ­odo pago.
async function onSubscription(admin: SupabaseClient, id: string) {
  const subscription = await mercadoPago<Preapproval>(`/preapproval/${id}`);
  const status = subscription.status === "authorized" ? "ativa" : "cancelada";
  await admin.from("entitlements").update({ status, updated_at: new Date().toISOString() }).eq("provider_ref", subscription.id);
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return failure("MÃ©todo nÃ£o permitido.", 405);
  const url = new URL(request.url);
  const body = (await request.json().catch(() => ({}))) as { type?: string; data?: { id?: string | number } };
  const type = body.type ?? url.searchParams.get("type") ?? "";
  const dataId = String(url.searchParams.get("data.id") ?? body.data?.id ?? "");
  if (!dataId || !(await validSignature(request, dataId))) return failure("Assinatura invÃ¡lida.", 401);

  const admin = adminClient();
  try {
    if (type === "payment") await onPayment(admin, dataId);
    else if (type === "subscription_authorized_payment") await onAuthorizedPayment(admin, dataId);
    else if (type === "subscription_preapproval") await onSubscription(admin, dataId);
  } catch {
    // Erro aqui faz o Mercado Pago repetir o aviso mais tarde, o que Ã© o certo: nada foi perdido.
    return failure("NÃ£o foi possÃ­vel processar o aviso agora.", 500);
  }
  return json({ ok: true });
});

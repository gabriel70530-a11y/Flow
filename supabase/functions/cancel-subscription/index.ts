// Cancela a assinatura mensal no Mercado Pago. O Pro continua até o fim do período já pago.
import { mercadoPago } from "../_shared/mercadopago.ts";
import { adminClient, failure, json, preflight, requireUser } from "../_shared/server.ts";

Deno.serve(async (request) => {
  const options = preflight(request);
  if (options) return options;
  const admin = adminClient();
  const user = await requireUser(request, admin);
  if (!user) return failure("Entre na sua conta.", 401);

  const { data } = await admin.from("entitlements").select("plan, status, provider_ref").eq("user_id", user.id).maybeSingle();
  if (!data || data.plan !== "mensal" || data.status !== "ativa" || !data.provider_ref) {
    return failure("Não há assinatura mensal ativa para cancelar.", 400);
  }
  try {
    await mercadoPago(`/preapproval/${data.provider_ref}`, { method: "PUT", body: { status: "cancelled" } });
  } catch {
    return failure("Não foi possível cancelar agora. Tente de novo.", 502);
  }
  await admin.from("entitlements").update({ status: "cancelada", updated_at: new Date().toISOString() }).eq("user_id", user.id);
  return json({ ok: true });
});

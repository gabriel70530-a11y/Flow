// Cria o pagamento no Mercado Pago e devolve o link para a pessoa pagar.
// Mensal: assinatura recorrente no cartão. Anual: uma cobrança só (Pix ou cartão), sem renovação automática.
import { PRICES, mercadoPago, referenceFor, type BillingPlan } from "../_shared/mercadopago.ts";
import { adminClient, env, failure, json, preflight, requireUser } from "../_shared/server.ts";

Deno.serve(async (request) => {
  const options = preflight(request);
  if (options) return options;
  if (!Deno.env.get("MP_ACCESS_TOKEN")) return failure("A assinatura ainda não está disponível.", 503);

  const admin = adminClient();
  const user = await requireUser(request, admin);
  if (!user?.email) return failure("Entre na sua conta para assinar.", 401);

  const { plan } = (await request.json().catch(() => ({}))) as { plan?: BillingPlan };
  if (plan !== "mensal" && plan !== "anual") return failure("Escolha o plano mensal ou anual.", 400);

  const appUrl = env("APP_URL");
  const backUrl = `${appUrl}/planos?pagamento=retorno`;
  try {
    if (plan === "mensal") {
      // Um plano por pessoa: o link aceita qualquer conta do Mercado Pago (a assinatura direta exige o mesmo e-mail
      // da conta do Flow) e a referência do plano diz ao webhook de quem é a assinatura.
      const subscriptionPlan = await mercadoPago<{ init_point: string }>("/preapproval_plan", {
        method: "POST",
        body: {
          reason: "Flow Pro mensal",
          external_reference: referenceFor("mensal", user.id),
          auto_recurring: { frequency: 1, frequency_type: "months", transaction_amount: PRICES.mensal, currency_id: "BRL" },
          back_url: backUrl,
        },
      });
      return json({ url: subscriptionPlan.init_point });
    }

    const preference = await mercadoPago<{ init_point: string }>("/checkout/preferences", {
      method: "POST",
      body: {
        items: [{ id: "flow-pro-anual", title: "Flow Pro anual", quantity: 1, unit_price: PRICES.anual, currency_id: "BRL" }],
        external_reference: referenceFor("anual", user.id),
        payer: { email: user.email },
        back_urls: { success: backUrl, pending: backUrl, failure: backUrl },
        auto_return: "approved",
        notification_url: `${env("SUPABASE_URL")}/functions/v1/mercadopago-webhook`,
        statement_descriptor: "FLOW PRO",
      },
    });
    return json({ url: preference.init_point });
  } catch {
    return failure("Não foi possível abrir o pagamento agora. Tente de novo.", 502);
  }
});

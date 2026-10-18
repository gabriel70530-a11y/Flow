"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorText } from "@/components/conta/AuthForm";
import { showToast } from "@/components/ui/Toast";
import { shortDate, toDateKey } from "@/lib/dates";
import { PRICES, isProActive, paymentsOpen, proTrialOpen, type BillingPlan } from "@/lib/plan";
import { cancelSubscription, startCheckout, syncNow } from "@/store/cloud";
import { usePro } from "@/store/pro";
import { InterestLink } from "./InterestLink";

const PLAN_NAMES: Record<BillingPlan, string> = { mensal: "mensal", anual: "anual" };

function CancelButton() {
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="justify-self-start text-[13px] text-muted underline underline-offset-3">
        Cancelar a assinatura
      </button>
    );
  }
  return (
    <div className="grid gap-2">
      <p>Nada mais é cobrado e o Pro continua até o fim do período já pago.</p>
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={sending}
          onClick={async () => {
            setSending(true);
            const result = await cancelSubscription();
            setSending(false);
            if (result) setError(result);
            else showToast("Assinatura cancelada.");
          }}
        >
          Confirmar cancelamento
        </Button>
        <Button onClick={() => setConfirming(false)}>Manter</Button>
      </div>
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}

// Nunca libera o Pro pelo navegador: só mostra o que o servidor confirmou e leva ao pagamento.
export function ProActions({ interestUrl }: { interestUrl: string | null }) {
  const record = usePro((state) => state.record);
  const [sending, setSending] = useState<BillingPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("pagamento") !== "retorno") return;
    window.history.replaceState(null, "", window.location.pathname);
    showToast("Assim que o Mercado Pago confirmar o pagamento, o Pro aparece aqui.");
    void syncNow();
  }, []);

  if (record && isProActive(record, new Date())) {
    const until = shortDate(toDateKey(new Date(record.proUntil)));
    return (
      <div className="grid gap-2 rounded-[12px] bg-hover p-3.5 text-[13px]">
        <p>
          <strong>Seu plano: Pro {PLAN_NAMES[record.plan]}.</strong>{" "}
          {record.plan === "mensal" && record.status === "ativa"
            ? `Renova sozinho; o período pago vai até ${until}.`
            : `O Pro vale até ${until}.`}
        </p>
        {record.plan === "mensal" && record.status === "ativa" && <CancelButton />}
        {record.plan === "anual" && <p className="text-muted">O anual não renova sozinho: perto do fim, você decide se continua.</p>}
      </div>
    );
  }

  if (paymentsOpen()) {
    const subscribe = async (plan: BillingPlan) => {
      setSending(plan);
      setError(null);
      const result = await startCheckout(plan);
      setSending(null);
      if (result) setError(result);
    };
    return (
      <div className="grid gap-3">
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="lg" disabled={sending !== null} onClick={() => subscribe("mensal")}>
            {sending === "mensal" ? "Abrindo…" : `Assinar mensal · ${PRICES.mensal.label}`}
          </Button>
          <Button size="lg" disabled={sending !== null} onClick={() => subscribe("anual")}>
            {sending === "anual" ? "Abrindo…" : `Assinar anual · ${PRICES.anual.label}`}
          </Button>
        </div>
        {error && <ErrorText>{error}</ErrorText>}
        <div className="grid gap-1.5 text-[13px] text-muted">
          <p>O pagamento é feito no Mercado Pago. O Flow não vê nem guarda os dados do seu cartão.</p>
          <p>
            Mensal: no cartão, renova todo mês e você cancela aqui quando quiser. Anual: Pix ou cartão, uma cobrança só, sem
            renovação automática. Você tem 7 dias depois do pagamento para desistir e receber o valor de volta.
          </p>
          {proTrialOpen() && <p>Durante o teste, os recursos do Pro já estão liberados para você.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-2 rounded-[12px] bg-hover p-3.5 text-[13px]">
        <p>
          <strong>Ainda não é possível assinar.</strong>{" "}
          {proTrialOpen()
            ? "Durante o teste, os recursos do Pro estão liberados para todos, sem cartão e sem cobrança."
            : "A assinatura abre em breve; nada é cobrado antes disso."}
        </p>
        <p className="text-muted">
          Preço, forma de cobrança, cancelamento e reembolso serão informados antes de qualquer pagamento.
        </p>
      </div>
      {interestUrl && <InterestLink href={interestUrl} />}
    </div>
  );
}

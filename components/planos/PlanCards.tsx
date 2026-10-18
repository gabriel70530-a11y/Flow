import { Check } from "lucide-react";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { FREE_FEATURES, PRO_FEATURES, PRO_PRICE, interestListUrl } from "@/lib/plan";
import { appOpen } from "@/lib/site";
import { InterestLink } from "./InterestLink";

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-2 text-sm">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <Check size={16} aria-hidden className="mt-0.5 shrink-0 text-success" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function PlanCards({ inApp = false }: { inApp?: boolean }) {
  const interestUrl = interestListUrl();

  return (
    <div className="grid items-start gap-5 md:grid-cols-2">
      <Card className="grid gap-4">
        <CardHeader title="Gratuito" className="mb-0" />
        <p>
          <strong className="font-heading text-3xl font-extrabold font-stretch-120% italic">R$ 0</strong>
          <span className="text-muted"> para sempre</span>
        </p>
        <p className="text-sm text-muted">O essencial para organizar os estudos, sem limite artificial.</p>
        <FeatureList items={FREE_FEATURES} />
        {inApp ? (
          <p className="text-[13px] text-muted">É o que você já usa.</p>
        ) : appOpen() ? (
          <Link href="/painel" className={buttonStyles("primary", "lg")}>
            Começar grátis
          </Link>
        ) : (
          <p className="text-[13px] text-muted">O Flow abre em breve.</p>
        )}
      </Card>

      <Card className="grid gap-4">
        <CardHeader title="Flow Pro" className="mb-0">
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">Preço experimental</span>
        </CardHeader>
        <p>
          <strong className="font-heading text-3xl font-extrabold font-stretch-120% italic tabular-nums">{PRO_PRICE}</strong>
        </p>
        <p className="text-sm text-muted">Para quem quer o plano da semana pronto e acompanhamento detalhado.</p>
        <FeatureList items={PRO_FEATURES} />
        <div className="grid gap-2 rounded-[12px] bg-hover p-3.5 text-[13px]">
          <p>
            <strong>Ainda não é possível assinar.</strong> O Pro está em validação: durante o teste, estes recursos estão
            liberados para todos, sem cartão e sem cobrança.
          </p>
          <p className="text-muted">
            Quando a assinatura existir, preço, forma de cobrança, cancelamento e reembolso serão informados antes de qualquer
            pagamento.
          </p>
        </div>
        {interestUrl ? (
          <InterestLink href={interestUrl} />
        ) : (
          <p className="text-[13px] text-muted">A lista de interesse ainda não está aberta.</p>
        )}
      </Card>
    </div>
  );
}

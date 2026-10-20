import { Check } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { buttonStyles } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { FREE_FEATURES, PRICES, PRO_FEATURES, interestListUrl } from "@/lib/plan";
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

// Dentro do app, Planos passa os botões de assinar (que falam com o servidor); a landing não carrega nada disso.
export function PlanCards({ proActions }: { proActions?: ReactNode }) {
  const inApp = proActions !== undefined;
  const interestUrl = interestListUrl();

  return (
    <div className="grid items-start gap-5 md:grid-cols-2">
      <Card className="grid gap-4">
        <CardHeader title="Gratuito" className="mb-0" />
        <p>
          <strong className="font-heading text-3xl font-extrabold font-stretch-120% italic">R$ 0</strong>
          <span className="text-muted"> para sempre</span>
        </p>
        <p className="text-sm text-muted">O essencial para organizar os estudos. Pede só uma conta.</p>
        <FeatureList items={FREE_FEATURES} />
        {inApp ? (
          <p className="text-[13px] text-muted">É o que todo mundo usa, sem pagar nada.</p>
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
          {!inApp && (
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">Em breve</span>
          )}
        </CardHeader>
        {inApp && (
          <p>
            <strong className="font-heading text-3xl font-extrabold font-stretch-120% italic tabular-nums">
              {PRICES.mensal.label.replace("/mês", "")}
            </strong>
            <span className="text-muted"> /mês ou {PRICES.anual.label}</span>
          </p>
        )}
        <p className="text-sm text-muted">Organiza a semana por você, guarda tudo na nuvem e traz o simulado no app.</p>
        <FeatureList items={PRO_FEATURES} />
        {inApp ? (
          proActions
        ) : interestUrl ? (
          <InterestLink href={interestUrl} />
        ) : (
          <p className="text-[13px] text-muted">A lista de interesse ainda não está aberta.</p>
        )}
      </Card>
    </div>
  );
}

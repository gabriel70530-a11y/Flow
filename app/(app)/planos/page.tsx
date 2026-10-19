import type { Metadata } from "next";
import { PlanCards } from "@/components/planos/PlanCards";
import { ProActions } from "@/components/planos/ProActions";
import { interestListUrl } from "@/lib/plan";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Planos" };

export default function PlanosPage() {
  return (
    <div className="grid gap-5">
      <PageHeader title="Planos" subtitle="O gratuito resolve o essencial. O Pro organiza por você, analisa e corrige com IA." />
      <PlanCards proActions={<ProActions interestUrl={interestListUrl()} />} />
    </div>
  );
}

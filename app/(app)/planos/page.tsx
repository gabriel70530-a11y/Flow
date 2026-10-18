import type { Metadata } from "next";
import { PlanCards } from "@/components/planos/PlanCards";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Planos" };

export default function PlanosPage() {
  return (
    <div className="grid gap-5">
      <PageHeader title="Planos" subtitle="O gratuito resolve o essencial. O Pro está em teste e ainda não é vendido." />
      <PlanCards inApp />
    </div>
  );
}

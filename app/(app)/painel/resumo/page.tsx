import type { Metadata } from "next";
import { ResumoScreen } from "@/components/painel/ResumoScreen";

export const metadata: Metadata = { title: "Sua semana" };

export default function ResumoPage() {
  return <ResumoScreen />;
}

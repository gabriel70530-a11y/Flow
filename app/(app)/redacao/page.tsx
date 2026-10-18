import type { Metadata } from "next";
import { RedacaoScreen } from "@/components/redacao/RedacaoScreen";

export const metadata: Metadata = { title: "Redação" };

export default function RedacaoPage() {
  return <RedacaoScreen />;
}

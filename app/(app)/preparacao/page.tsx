import type { Metadata } from "next";
import { PreparacaoScreen } from "@/components/preparacao/PreparacaoScreen";

export const metadata: Metadata = { title: "Preparação" };

export default function PreparacaoPage() {
  return <PreparacaoScreen />;
}

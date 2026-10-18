import type { Metadata } from "next";
import { PainelScreen } from "@/components/painel/PainelScreen";

export const metadata: Metadata = { title: "Painel" };

export default function PainelPage() {
  return <PainelScreen />;
}

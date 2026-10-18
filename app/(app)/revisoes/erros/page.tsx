import type { Metadata } from "next";
import { MistakesScreen } from "@/components/revisoes/MistakesScreen";

export const metadata: Metadata = { title: "Caderno de erros" };

export default function ErrosPage() {
  return <MistakesScreen />;
}

import type { Metadata } from "next";
import { ProvaScreen } from "@/components/prova/ProvaScreen";

export const metadata: Metadata = { title: "Dia da prova" };

export default function ProvaPage() {
  return <ProvaScreen />;
}

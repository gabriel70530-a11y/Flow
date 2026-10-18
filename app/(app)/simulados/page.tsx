import type { Metadata } from "next";
import { SimuladosScreen } from "@/components/simulados/SimuladosScreen";

export const metadata: Metadata = { title: "Simulados" };

export default function SimuladosPage() {
  return <SimuladosScreen />;
}

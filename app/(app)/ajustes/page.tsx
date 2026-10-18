import type { Metadata } from "next";
import { AjustesScreen } from "@/components/ajustes/AjustesScreen";

export const metadata: Metadata = { title: "Ajustes" };

export default function AjustesPage() {
  return <AjustesScreen />;
}

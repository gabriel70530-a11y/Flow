import type { Metadata } from "next";
import { ConquistasScreen } from "@/components/conquistas/ConquistasScreen";

export const metadata: Metadata = { title: "Conquistas" };

export default function ConquistasPage() {
  return <ConquistasScreen />;
}

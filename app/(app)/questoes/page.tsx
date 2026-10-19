import type { Metadata } from "next";
import { QuestoesScreen } from "@/components/questoes/QuestoesScreen";

export const metadata: Metadata = { title: "Questões" };

export default function QuestoesPage() {
  return <QuestoesScreen />;
}

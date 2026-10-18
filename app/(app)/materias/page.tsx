import type { Metadata } from "next";
import { MateriasScreen } from "@/components/materias/MateriasScreen";

export const metadata: Metadata = { title: "Matérias" };

export default function MateriasPage() {
  return <MateriasScreen />;
}

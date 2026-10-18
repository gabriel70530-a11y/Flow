import type { Metadata } from "next";
import { RevisoesScreen } from "@/components/revisoes/RevisoesScreen";

export const metadata: Metadata = { title: "Revisões" };

export default function RevisoesPage() {
  return <RevisoesScreen />;
}

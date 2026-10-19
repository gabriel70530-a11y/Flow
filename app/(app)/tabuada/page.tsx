import type { Metadata } from "next";
import { TabuadaScreen } from "@/components/tabuada/TabuadaScreen";

export const metadata: Metadata = { title: "Tabuada" };

export default function TabuadaPage() {
  return <TabuadaScreen />;
}

import type { Metadata } from "next";
import { CronogramaScreen } from "@/components/cronograma/CronogramaScreen";

export const metadata: Metadata = { title: "Cronograma" };

export default function CronogramaPage() {
  return <CronogramaScreen />;
}

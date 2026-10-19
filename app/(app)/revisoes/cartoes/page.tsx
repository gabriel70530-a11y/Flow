import type { Metadata } from "next";
import { CardsScreen } from "@/components/revisoes/CardsScreen";

export const metadata: Metadata = { title: "Cartões" };

export default function CartoesPage() {
  return <CardsScreen />;
}

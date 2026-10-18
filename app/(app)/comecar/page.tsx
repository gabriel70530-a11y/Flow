import type { Metadata } from "next";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export const metadata: Metadata = { title: "Começar" };

export default function ComecarPage() {
  return <OnboardingFlow />;
}

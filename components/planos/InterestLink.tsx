"use client";

import { buttonStyles } from "@/components/ui/Button";
import { savedConsent, track } from "@/store/analytics";

// Fica fora da store para a landing não baixar o app inteiro só por este link.
export function InterestLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("pro_interesse", savedConsent())}
      className={buttonStyles("secondary", "lg")}
    >
      Entrar na lista de interesse
    </a>
  );
}

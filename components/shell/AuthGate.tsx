"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { AuthForm, BirthYearForm } from "@/components/conta/AuthForm";
import { linkStyles } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";
import { startCloud, useCloud } from "@/store/cloud";
import { useHydrated } from "@/store/study-store";
import { Wordmark } from "./Wordmark";

function GateScreen({ children }: { children: ReactNode }) {
  return (
    <main
      id="conteudo"
      className="grid min-h-dvh place-items-center px-[max(16px,env(safe-area-inset-left,0px))] py-10"
    >
      <div className="grid w-full max-w-[440px] gap-6">
        <Wordmark />
        <Card className="grid gap-4">{children}</Card>
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
          <Link href="/" className={linkStyles}>
            Página inicial
          </Link>
          <Link href="/privacidade" className={linkStyles}>
            Privacidade
          </Link>
          <Link href="/termos" className={linkStyles}>
            Termos
          </Link>
        </p>
      </div>
      <Toast />
    </main>
  );
}

// O app só abre com a conta. Depois de entrar, os dados ficam no aparelho e tudo funciona sem internet.
export function AuthGate({ children }: { children: ReactNode }) {
  const hydrated = useHydrated();
  const { available, authReady, email, birthYear } = useCloud();

  // Só depois de ler o aparelho: a sincronização compara com o que está salvo nele.
  useEffect(() => {
    if (hydrated) return startCloud();
  }, [hydrated]);

  if (!available) {
    // Sem o Supabase configurado, o desenvolvimento local continua possível; em produção, a interface diz o que falta.
    if (process.env.NODE_ENV === "development") return children;
    return (
      <GateScreen>
        <p>A conta ainda não está disponível neste endereço. Volte em breve.</p>
      </GateScreen>
    );
  }

  if (!hydrated || !authReady) {
    return (
      <GateScreen>
        <Skeleton className="h-64 border-0" />
      </GateScreen>
    );
  }

  if (!email) {
    return (
      <GateScreen>
        <p className="text-muted">
          Entre para começar. Seus dados ficam no aparelho e numa cópia na sua conta, e o Flow funciona sem internet depois de
          entrar.
        </p>
        <AuthForm />
      </GateScreen>
    );
  }

  if (birthYear === null) {
    return (
      <GateScreen>
        <BirthYearForm />
      </GateScreen>
    );
  }

  return children;
}

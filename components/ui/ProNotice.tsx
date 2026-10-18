import { Lock } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { linkStyles } from "./Button";

// Aviso discreto no lugar de um recurso do Pro: diz o que ele faz e leva aos planos, sem esconder nada salvo.
export function ProNotice({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={`grid gap-2 rounded-[12px] bg-accent-soft p-3.5 text-sm ${className}`}>
      <strong className="flex items-center gap-1.5">
        <Lock size={16} aria-hidden className="shrink-0 text-accent" />
        {title}
      </strong>
      <div className="text-muted">{children}</div>
      <Link href="/planos" className={`${linkStyles} justify-self-start`}>
        Conhecer o Pro
      </Link>
    </div>
  );
}

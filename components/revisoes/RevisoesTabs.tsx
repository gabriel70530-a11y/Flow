"use client";

import Link from "next/link";
import { useProAccess } from "@/store/pro";

const TABS = [
  { href: "/revisoes", label: "Tópicos" },
  { href: "/revisoes/erros", label: "Caderno de erros" },
] as const;

// Revisões de tópicos e do caderno de erros: duas telas com o mesmo cabeçalho, alternadas como um segmented.
export function RevisoesTabs({ current, mistakesDue }: { current: (typeof TABS)[number]["href"]; mistakesDue: number }) {
  const pro = useProAccess();
  return (
    <nav aria-label="Tipo de revisão" className="flex max-w-md rounded-[20px] bg-hover p-[3px]">
      {TABS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          aria-current={href === current ? "page" : undefined}
          className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold whitespace-nowrap text-muted aria-[current=page]:bg-action aria-[current=page]:text-on-action"
        >
          {label}
          {href === "/revisoes/erros" && !pro && <span className="text-xs font-bold opacity-80">Pro</span>}
          {href === "/revisoes/erros" && mistakesDue > 0 && (
            <span className="rounded-full bg-danger px-1.5 text-xs leading-[18px] font-bold text-white tabular-nums">{mistakesDue}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}

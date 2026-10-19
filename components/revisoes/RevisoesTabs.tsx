"use client";

import Link from "next/link";
import { toDateKey } from "@/lib/dates";
import { dueCards } from "@/lib/flashcards";
import { dueMistakes } from "@/lib/mistakes";
import { useProAccess } from "@/store/pro";
import { useStudyStore } from "@/store/study-store";

const TABS = [
  { href: "/revisoes", label: "Tópicos" },
  { href: "/revisoes/erros", label: "Erros" },
  { href: "/revisoes/cartoes", label: "Cartões" },
] as const;

// Revisões de tópicos, do caderno de erros e dos cartões: telas com o mesmo cabeçalho, alternadas como um segmented.
export function RevisoesTabs({ current }: { current: (typeof TABS)[number]["href"] }) {
  const pro = useProAccess();
  const mistakes = useStudyStore((state) => state.mistakes);
  const flashcards = useStudyStore((state) => state.flashcards);
  const today = toDateKey(new Date());
  const badges: Record<string, number> = {
    "/revisoes/erros": pro ? dueMistakes(mistakes, today).length : 0,
    "/revisoes/cartoes": dueCards(flashcards, today).length,
  };
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
          {(badges[href] ?? 0) > 0 && (
            <span className="rounded-full bg-danger px-1.5 text-xs leading-[18px] font-bold text-white tabular-nums">{badges[href]}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}

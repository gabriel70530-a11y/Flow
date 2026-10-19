"use client";

import { Award, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { PREP_ITEMS } from "@/components/shell/nav-items";
import { useAchievements } from "@/components/conquistas/use-achievements";
import { toDateKey } from "@/lib/dates";
import { dueCards } from "@/lib/flashcards";
import { useHydrated, useStudyStore } from "@/store/study-store";

const DETAILS: Record<string, string> = {
  "/questoes": "Blocos de 5 por tema",
  "/simulados": "Prova oficial no app",
  "/redacao": "Temas e correção",
  "/revisoes/cartoes": "Seus cartões de memorização",
  "/tabuada": "Rodadas de 20 contas",
  "/prova": "Checklist",
};

export function PreparacaoScreen() {
  const hydrated = useHydrated();
  const flashcards = useStudyStore((state) => state.flashcards);
  const mockCount = useStudyStore((state) => state.mockExams.length);
  const essayCount = useStudyStore((state) => state.essays.length);
  const { status } = useAchievements();
  const cardsDue = hydrated ? dueCards(flashcards, toDateKey(new Date())).length : 0;
  const unlocked = status.filter((item) => item.unlocked).length;

  const detail = (href: string) => (href === "/revisoes/cartoes" && cardsDue > 0 ? `${cardsDue} para hoje` : DETAILS[href]);
  const count: Record<string, number> = { "/simulados": mockCount, "/redacao": essayCount };
  const items = [
    ...PREP_ITEMS.map((item) => ({ ...item, detail: detail(item.href), count: hydrated ? count[item.href] : 0 })),
    { href: "/conquistas", label: "Conquistas", icon: Award, detail: `${unlocked} de ${status.length}`, count: 0 },
  ];

  return (
    <div className="grid gap-4 md:gap-6">
      <PageHeader title="Preparação" subtitle="Ferramentas para treinar para a prova" />
      <Card flush className="max-w-2xl">
        <ul className="px-[18px] md:px-6">
          {items.map(({ href, label, icon: Icon, detail: text, count: total }) => (
            <li key={href} className="border-t border-line first:border-t-0">
              <Link href={href} className="-mx-2 flex items-center gap-3 rounded-[12px] px-2 py-3 hover:bg-hover">
                <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-hover text-accent">
                  <Icon size={18} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{label}</span>
                  <span className="block text-[13px] text-muted tabular-nums">{text}</span>
                </span>
                {total > 0 && <span className="text-[13px] text-muted tabular-nums">{total}</span>}
                <ChevronRight size={16} className="shrink-0 text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

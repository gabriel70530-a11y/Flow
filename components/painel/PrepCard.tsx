"use client";

import { ChevronRight, ClipboardCheck, Grid3x3, Layers, ListChecks, NotebookPen, PenLine, TimerReset, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { shortDate } from "@/lib/dates";
import { daysUntil, isFinalStretch, nextExamDay, secondExamDay } from "@/lib/exam";
import { dueCards } from "@/lib/flashcards";
import { dueMistakes } from "@/lib/mistakes";
import { useStudyStore } from "@/store/study-store";

function ToolLink({ href, icon: Icon, label, detail }: { href: string; icon: LucideIcon; label: string; detail?: string }) {
  return (
    <li className="border-t border-line first:border-t-0">
      <Link href={href} className="-mx-2 flex items-center gap-3 rounded-[12px] px-2 py-2.5 hover:bg-hover">
        <Icon size={18} className="shrink-0 text-accent" aria-hidden />
        <span className="flex-1 font-medium">{label}</span>
        {detail && <span className="text-[13px] text-muted tabular-nums">{detail}</span>}
        <ChevronRight size={16} className="text-muted" aria-hidden />
      </Link>
    </li>
  );
}

// Data da prova, reta final e as ferramentas de preparação (dia da prova, erros, simulados, redação).
export function PrepCard({ today, className = "" }: { today: string; className?: string }) {
  const targetDate = useStudyStore((state) => state.planner.targetDate);
  const mistakes = useStudyStore((state) => state.mistakes);
  const flashcards = useStudyStore((state) => state.flashcards);
  const mockCount = useStudyStore((state) => state.mockExams.length);
  const essayCount = useStudyStore((state) => state.essays.length);
  const upcoming = nextExamDay(targetDate, today);
  const finalStretch = upcoming !== null && isFinalStretch(upcoming.date, today);
  const remaining = upcoming ? daysUntil(upcoming.date, today) : null;
  const dueCount = dueMistakes(mistakes, today).length;
  const cardsDue = dueCards(flashcards, today).length;

  return (
    <Card className={className}>
      <CardHeader title={finalStretch ? "Reta final" : "Preparação"} />
      {remaining !== null && upcoming && targetDate && (
        <div className="mb-4">
          <p className="font-heading text-[44px] leading-none font-extrabold tabular-nums font-stretch-115%">
            {remaining === 0 ? "Hoje" : remaining}
          </p>
          <p className="mt-1.5 text-sm text-muted tabular-nums">
            {remaining === 0
              ? `é o ${upcoming.day}º dia do Enem. Boa prova!`
              : `${remaining === 1 ? "dia" : "dias"} para o ${upcoming.day}º dia do Enem`}
            <span className="block text-[13px]">
              Enem: {shortDate(targetDate)} e {shortDate(secondExamDay(targetDate))}
            </span>
          </p>
          {finalStretch && (
            <p className="mt-3 text-[13px] text-muted">
              Nas últimas 4 semanas, o plano coloca revisões e o que já está em andamento antes de conteúdo novo.
            </p>
          )}
        </div>
      )}
      <ul>
        {finalStretch && <ToolLink href="/prova" icon={ClipboardCheck} label="Checklist do dia da prova" />}
        <ToolLink
          href="/revisoes/erros"
          icon={NotebookPen}
          label="Caderno de erros"
          detail={dueCount > 0 ? `${dueCount} para rever` : mistakes.length ? String(mistakes.length) : undefined}
        />
        <ToolLink
          href="/revisoes/cartoes"
          icon={Layers}
          label="Cartões"
          detail={cardsDue > 0 ? `${cardsDue} para estudar` : flashcards.length ? String(flashcards.length) : undefined}
        />
        <ToolLink href="/questoes" icon={ListChecks} label="Blocos de questões" />
        <ToolLink href="/simulados" icon={TimerReset} label="Simulados" detail={mockCount ? String(mockCount) : undefined} />
        <ToolLink href="/tabuada" icon={Grid3x3} label="Tabuada" />
        <ToolLink href="/redacao" icon={PenLine} label="Redação" detail={essayCount ? String(essayCount) : undefined} />
      </ul>
    </Card>
  );
}

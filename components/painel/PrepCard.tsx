"use client";

import { ChevronRight, ClipboardCheck, NotebookPen, PenLine, TimerReset, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { showToast } from "@/components/ui/Toast";
import { shortDate } from "@/lib/dates";
import { daysUntil, isFinalStretch, suggestedExamDate } from "@/lib/exam";
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
  const mockCount = useStudyStore((state) => state.mockExams.length);
  const essayCount = useStudyStore((state) => state.essays.length);
  const setTargetDate = useStudyStore((state) => state.setTargetDate);
  const upcoming = targetDate && targetDate >= today ? targetDate : null;
  const finalStretch = isFinalStretch(upcoming, today);
  const suggestion = upcoming ? null : suggestedExamDate(today);
  const remaining = upcoming ? daysUntil(upcoming, today) : null;
  const dueCount = dueMistakes(mistakes, today).length;

  return (
    <Card className={className}>
      <CardHeader title={finalStretch ? "Reta final" : "Preparação"} />
      {remaining !== null && upcoming && (
        <div className="mb-4">
          <p className="font-heading text-[44px] leading-none font-extrabold tabular-nums font-stretch-115%">
            {remaining === 0 ? "Hoje" : remaining}
          </p>
          <p className="mt-1.5 text-sm text-muted tabular-nums">
            {remaining === 0 ? "é o dia da prova. Boa prova!" : `${remaining === 1 ? "dia" : "dias"} para a prova, em ${shortDate(upcoming)}`}
          </p>
          {finalStretch && (
            <p className="mt-3 text-[13px] text-muted">
              Nas últimas 4 semanas, o plano coloca revisões e o que já está em andamento antes de conteúdo novo.
            </p>
          )}
        </div>
      )}
      {suggestion && (
        <div className="mb-4 grid gap-3">
          <p className="text-sm text-muted">Informe a data da prova para o Flow organizar a reta final.</p>
          <Button
            className="justify-self-start"
            onClick={() => {
              setTargetDate(suggestion);
              showToast("Data da prova salva. Dá para mudar no Cronograma.");
            }}
          >
            Usar {shortDate(suggestion)}, 1º dia do Enem 2026
          </Button>
        </div>
      )}
      <ul>
        {(finalStretch || suggestion) && <ToolLink href="/prova" icon={ClipboardCheck} label="Checklist do dia da prova" />}
        <ToolLink
          href="/revisoes/erros"
          icon={NotebookPen}
          label="Caderno de erros"
          detail={dueCount > 0 ? `${dueCount} para rever` : mistakes.length ? String(mistakes.length) : undefined}
        />
        <ToolLink href="/simulados" icon={TimerReset} label="Simulados" detail={mockCount ? String(mockCount) : undefined} />
        <ToolLink href="/redacao" icon={PenLine} label="Redação" detail={essayCount ? String(essayCount) : undefined} />
      </ul>
    </Card>
  );
}

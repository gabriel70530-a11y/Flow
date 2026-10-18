"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { CheckRow } from "@/components/ui/CheckRow";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { shortDate, toDateKey } from "@/lib/dates";
import { ENEM_DATES, checklistIds, countdownLabel, examChecklist, secondExamDay, type ExamDay } from "@/lib/exam";
import { useHydrated, useStudyStore } from "@/store/study-store";

const SUBTITLE = "Marque o que já está pronto. Fica salvo neste aparelho.";

export function ProvaScreen() {
  const hydrated = useHydrated();
  const targetDate = useStudyStore((state) => state.planner.targetDate);
  const checked = useStudyStore((state) => state.examChecklist);
  const { toggleChecklistItem, resetChecklist } = useStudyStore.getState();
  const [chosenDay, setChosenDay] = useState<ExamDay | null>(null);

  if (!hydrated) {
    return (
      <div className="grid gap-6">
        <PageHeader title="Dia da prova" subtitle={SUBTITLE} />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const today = toDateKey(new Date());
  const firstDay = targetDate ?? ENEM_DATES.first;
  const secondDay = secondExamDay(firstDay);
  // Passado o primeiro dia, a tela abre no segundo.
  const day: ExamDay = chosenDay ?? (today > firstDay ? 2 : 1);
  const date = day === 1 ? firstDay : secondDay;
  const ids = checklistIds(day);
  const done = ids.filter((id) => checked.includes(id)).length;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Dia da prova"
        subtitle={date >= today ? `${countdownLabel(date, today)}. ${SUBTITLE}` : SUBTITLE}
      />

      <div className="grid max-w-2xl gap-6">
        <Segmented
          options={[
            { value: 1 as ExamDay, label: `1º dia · ${shortDate(firstDay)}` },
            { value: 2 as ExamDay, label: `2º dia · ${shortDate(secondDay)}` },
          ]}
          value={day}
          onChange={setChosenDay}
        />

        <div className="grid gap-2">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-semibold">
              {done === ids.length ? "Tudo pronto. Boa prova!" : `${done} de ${ids.length} prontos`}
            </span>
            {done > 0 && (
              <button type="button" onClick={() => resetChecklist(day)} className="text-[13px] text-muted underline underline-offset-3">
                Desmarcar tudo
              </button>
            )}
          </div>
          <ProgressBar value={done / ids.length} label="Itens prontos" />
        </div>

        {examChecklist(day).map((group) => (
          <Card key={group.title}>
            <CardHeader title={group.title} />
            <ul className="grid gap-1">
              {group.items.map((item) => {
                const isChecked = checked.includes(item.id);
                return (
                  <li key={item.id}>
                    <CheckRow
                      checked={isChecked}
                      onToggle={() => toggleChecklistItem(item.id)}
                      label={item.label}
                      hint={item.hint}
                      strike
                    />
                  </li>
                );
              })}
            </ul>
          </Card>
        ))}

        <p className="text-[13px] text-muted">
          As regras oficiais (horários, documentos aceitos e objetos permitidos) estão no edital e no cartão de confirmação do
          Inep. Confira lá antes da prova.
        </p>
        <div>
          <Button onClick={() => window.print()}>Imprimir checklist</Button>
        </div>
      </div>
    </div>
  );
}

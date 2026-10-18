"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { linkStyles } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProBadge } from "@/components/ui/ProBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { addDays } from "@/lib/dates";
import {
  activeDays,
  formatDuration,
  formatHours,
  leastStudiedArea,
  plannedVersusDone,
  secondsBetween,
  topicCounts,
} from "@/lib/stats";
import { findArea } from "@/lib/syllabus";
import { useStudyStore } from "@/store/study-store";

const CONSISTENCY_DAYS = 14;

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-t border-line py-3 first:border-t-0 first:pt-0 last:pb-0">
      <span className="text-[13px] text-muted">{label}</span>
      <div className="text-sm tabular-nums">{children}</div>
    </div>
  );
}

export function SummaryCard({ today, monday }: { today: string; monday: string }) {
  const sessions = useStudyStore((state) => state.sessions);
  const tasks = useStudyStore((state) => state.tasks);
  const progress = useStudyStore((state) => state.progress);
  const topics = useStudyStore((state) => state.topics);

  const sunday = addDays(monday, 6);
  const { taskCount, tasksDone, taskFocusSeconds, doneSeconds } = plannedVersusDone(tasks, sessions, monday, sunday);
  const weekSessions = sessions.filter((session) => session.date >= monday && session.date <= sunday);
  const interrupted = weekSessions.filter((session) => session.state === "interrompida").length;
  const focusAnswers = weekSessions.filter((session) => session.distracted !== undefined);
  const focused = focusAnswers.filter((session) => !session.distracted).length;
  const previousSeconds = secondsBetween(sessions, addDays(monday, -7), addDays(monday, -1));
  const difference = doneSeconds - previousSeconds;
  const windowStart = addDays(today, -(CONSISTENCY_DAYS - 1));
  const studiedDays = activeDays(sessions, windowStart, today);
  const weakArea = leastStudiedArea(sessions, windowStart, today);
  const counts = topicCounts(progress, topics);

  return (
    <Card>
      <CardHeader title="Resumo da semana">
        <ProBadge />
      </CardHeader>
      <div className="grid">
        <Row label="Matérias da semana">
          {taskCount > 0 ? (
            <>
              {tasksDone} de {taskCount} {taskCount === 1 ? "matéria dominada" : "matérias dominadas"} ·{" "}
              {formatDuration(taskFocusSeconds)} estudados nelas.
              <ProgressBar thin value={tasksDone / taskCount} className="mt-2" />
              <span className="mt-1 block text-[13px] text-muted">No total, {formatDuration(doneSeconds)} estudados na semana.</span>
            </>
          ) : (
            <>
              {formatDuration(doneSeconds)} estudados. Nenhuma matéria organizada nesta semana.{" "}
              <Link href="/cronograma" className={linkStyles}>
                Abrir cronograma
              </Link>
            </>
          )}
        </Row>
        <Row label="Sessões registradas">
          {weekSessions.length === 0
            ? "Nenhuma ainda."
            : `${weekSessions.length} ${weekSessions.length === 1 ? "sessão" : "sessões"}${interrupted ? `, ${interrupted} finalizada${interrupted === 1 ? "" : "s"} antes do fim do bloco` : ""}.`}
          {focusAnswers.length > 0 && (
            <span className="mt-1 block text-[13px] text-muted">
              {focused} de {focusAnswers.length} sem distração, pelas suas respostas.
            </span>
          )}
        </Row>
        <Row label="Tópicos">
          {counts.concluded} concluídos, {counts.inProgress} em andamento e {counts.needsReview} para revisar, de {counts.total}.
        </Row>
        <Row label={`Constância (dias com estudo nos últimos ${CONSISTENCY_DAYS})`}>
          {studiedDays} de {CONSISTENCY_DAYS} dias. Descanso também conta: a ideia é ritmo, não perfeição.
        </Row>
        {previousSeconds > 0 && (
          <Row label="Comparado à semana anterior">
            {formatHours(previousSeconds)} h → {formatHours(doneSeconds)} h (
            {difference === 0 ? "igual" : `${difference > 0 ? "+" : "−"}${formatHours(Math.abs(difference))} h`})
          </Row>
        )}
        {weakArea && (
          <Row label="Sugestão">
            {findArea(weakArea).name} teve menos tempo nos últimos {CONSISTENCY_DAYS} dias. Se fizer sentido para você, inclua
            no próximo plano.
          </Row>
        )}
      </div>
    </Card>
  );
}

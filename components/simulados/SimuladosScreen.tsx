"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button, linkStyles } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProNotice } from "@/components/ui/ProNotice";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { showToast } from "@/components/ui/Toast";
import { shortDate, toDateKey } from "@/lib/dates";
import {
  MOCK_DAY_AREAS,
  areaTrend,
  minutesPerQuestion,
  targetMinutesPerQuestion,
  type MockExam,
} from "@/lib/mock-exams";
import { findOfficialExam } from "@/lib/official-exams";
import { findArea } from "@/lib/syllabus";
import { useProAccess } from "@/store/pro";
import { useHydrated, useStudyStore } from "@/store/study-store";
import { MockExamForm } from "./MockExamForm";
import { ExamRunner, type ExamResult } from "./ExamRunner";
import { OfficialExamCard } from "./OfficialExamCard";

const SUBTITLE = "Treine com a prova oficial e no tempo do Enem. Acompanhe acertos e ritmo.";
const minutesFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function MockRow({ mock }: { mock: MockExam }) {
  const removeMockExam = useStudyStore((state) => state.removeMockExam);
  const [confirming, setConfirming] = useState(false);
  const pace = minutesPerQuestion(mock);
  const target = targetMinutesPerQuestion(mock.day);
  return (
    <li className="grid gap-2 border-t border-line px-5 py-4 first:border-t-0 md:px-7">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-semibold tabular-nums">
          {shortDate(mock.date)} · {mock.day}º dia
        </span>
        {confirming ? (
          <button type="button" onClick={() => removeMockExam(mock.id)} className="text-[13px] font-semibold text-danger">
            Confirmar exclusão
          </button>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className="text-[13px] text-muted underline underline-offset-3">
            Excluir
          </button>
        )}
      </div>
      <p className="text-sm tabular-nums">
        {mock.sections.map((section) => `${findArea(section.areaId).shortName} ${section.correct}/${section.total}`).join(" · ")}
      </p>
      {pace !== null && (
        <p className={`text-[13px] tabular-nums ${pace > target + 0.3 ? "text-danger" : "text-muted"}`}>
          {minutesFormat.format(pace)} min por questão (referência: {minutesFormat.format(target)})
          {pace > target + 0.3 && " · acima do tempo da prova"}
        </p>
      )}
      {mock.note && <p className="text-[13px] text-muted wrap-anywhere">{mock.note}</p>}
    </li>
  );
}

export function SimuladosScreen() {
  const hydrated = useHydrated();
  const mocks = useStudyStore((state) => state.mockExams);
  const [adding, setAdding] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);
  const draft = useStudyStore((state) => state.examDraft);
  const pro = useProAccess();

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <PageHeader title="Simulados" subtitle={SUBTITLE} />
      {hydrated && (
        <Button variant="primary" size="lg" onClick={() => setAdding(true)}>
          <Plus size={18} aria-hidden />
          Registrar simulado
        </Button>
      )}
    </div>
  );

  const runningExam = draft?.format === "app" && draft.startedAt !== null ? findOfficialExam(draft.examId) : null;
  if (hydrated && draft && runningExam) {
    return (
      <ExamRunner
        draft={draft}
        exam={runningExam}
        onFinish={(finished) => {
          setResult(finished);
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }

  if (!hydrated) {
    return (
      <div className="grid gap-6">
        {header}
        <Skeleton className="h-64" />
      </div>
    );
  }

  const today = toDateKey(new Date());
  const sorted = [...mocks].sort((first, second) => second.date.localeCompare(first.date));
  const areas = [...MOCK_DAY_AREAS[1], ...MOCK_DAY_AREAS[2]];

  return (
    <div className="grid gap-6">
      {header}

      <OfficialExamCard result={result} onResult={setResult} onCloseResult={() => setResult(null)} />

      {mocks.length === 0 ? (
        <Card flush>
          <EmptyState title="Nenhum simulado registrado">
            Faça uma prova inteira no tempo oficial (5h30 no 1º dia, 5h no 2º). Simulados feitos fora do app (MEC Enem,
            cursinho) entram em Registrar simulado. Treinar o ritmo ajuda tanto quanto o conteúdo.
          </EmptyState>
        </Card>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Card flush>
            <CardHeader flush title="Seus simulados">
              <span className="text-[13px] text-muted tabular-nums">{mocks.length}</span>
            </CardHeader>
            <ul className="pb-2">
              {sorted.map((mock) => (
                <MockRow key={mock.id} mock={mock} />
              ))}
            </ul>
          </Card>
          <Card>
            <CardHeader title="Acertos por área" />
            {!pro ? (
              <ProNotice title="Acompanhe a evolução com o Pro">
                Os acertos de cada área comparados com o simulado anterior.
              </ProNotice>
            ) : (
              <>
                <div className="grid gap-4">
                  {areas.map((areaId) => {
                    const trend = areaTrend(mocks, areaId);
                    if (!trend) return null;
                    const change = trend.previous === null ? null : Math.round((trend.last - trend.previous) * 100);
                    return (
                      <div key={areaId} className="grid gap-1.5">
                        <div className="flex justify-between gap-3 text-sm">
                          <span>{findArea(areaId).name}</span>
                          <span className="text-muted tabular-nums">
                            {percent(trend.last)}
                            {change !== null && change !== 0 && ` (${change > 0 ? "+" : ""}${change} pontos)`}
                          </span>
                        </div>
                        <ProgressBar value={trend.last} thin label={`Acertos em ${findArea(areaId).name}`} />
                      </div>
                    );
                  })}
                </div>
                <p className="mt-4 text-[13px] text-muted">Comparação com o simulado anterior que teve a mesma área.</p>
              </>
            )}
          </Card>
        </div>
      )}

      <Card>
        <CardHeader title="Por que o Flow não mostra nota?" />
        <div className="grid gap-2 text-sm text-muted">
          <p>
            A nota do Enem usa a TRI: cada questão tem um peso calculado pelo Inep, e acertos coerentes valem mais. Quem erra
            questões fáceis e acerta difíceis no chute pode tirar menos do que alguém com o mesmo número de acertos.
          </p>
          <p>
            Por isso o Flow mostra acertos e ritmo, não uma nota inventada. Na prova, garanta primeiro as fáceis e médias. Errou
            alguma no simulado?{" "}
            <Link href="/revisoes/erros" className={linkStyles}>
              Registre no caderno de erros
            </Link>
            .
          </p>
        </div>
      </Card>

      <Drawer open={adding} onClose={() => setAdding(false)} eyebrow="Simulados" title="Registrar simulado">
        {adding && (
          <MockExamForm
            today={today}
            onDone={() => {
              setAdding(false);
              showToast("Simulado registrado.");
            }}
          />
        )}
      </Drawer>
    </div>
  );
}

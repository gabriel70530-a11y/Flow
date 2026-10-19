"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Drawer } from "@/components/ui/Drawer";
import { DueLabel } from "@/components/ui/DueLabel";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListRow } from "@/components/ui/ListRow";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProNotice } from "@/components/ui/ProNotice";
import { Skeleton } from "@/components/ui/Skeleton";
import { showToast } from "@/components/ui/Toast";
import { toDateKey } from "@/lib/dates";
import { MISTAKE_REASONS, dueMistakes, mainReason, openMistakes, type Mistake } from "@/lib/mistakes";
import { studyTitle } from "@/lib/sessions";
import type { TopicRecord } from "@/lib/topics";
import { useProAccess } from "@/store/pro";
import { useHydrated, useStudyStore } from "@/store/study-store";
import { MistakeForm } from "./MistakeForm";
import { RevisoesTabs } from "./RevisoesTabs";

const SUBTITLE = "Cada erro volta em 1, 7, 15 e 30 dias, até você lembrar sem ajuda.";

function mistakeSubject(mistake: Mistake, topics: readonly TopicRecord[]): string {
  return mistake.areaId || mistake.topicId ? studyTitle(mistake.topicId, mistake.areaId, topics, mistake.subjectId) : "Sem assunto";
}

function DueMistake({ mistake, topics }: { mistake: Mistake; topics: readonly TopicRecord[] }) {
  const { answerMistake, removeMistake } = useStudyStore.getState();
  const [revealed, setRevealed] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  const answer = (remembered: boolean) => {
    answerMistake(mistake.id, remembered);
    showToast(remembered ? (mistake.stage === 3 ? "Erro superado. Saiu da fila." : "Boa. Ele volta mais tarde.") : "Sem problema. Ele volta amanhã.");
  };

  return (
    <li className="grid gap-3 border-t border-line px-5 py-4 first:border-t-0 md:px-7">
      <div className="grid gap-1">
        <span className="text-[13px] text-muted">
          {mistakeSubject(mistake, topics)} · {MISTAKE_REASONS[mistake.reason].label}
          {mistake.source && ` · ${mistake.source}`}
        </span>
        <p className="font-medium wrap-anywhere">{mistake.question}</p>
      </div>
      {revealed ? (
        <div className="grid gap-3">
          <p className="rounded-[12px] bg-hover px-3.5 py-3 text-sm wrap-anywhere">
            {mistake.lesson || "Você não anotou a resposta. Confira no material e tente lembrar o raciocínio."}
          </p>
          <p className="text-[13px] text-muted">{MISTAKE_REASONS[mistake.reason].tip}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" onClick={() => answer(true)}>
              Lembrei
            </Button>
            <Button onClick={() => answer(false)}>Não lembrei</Button>
            {confirmingRemove ? (
              <button type="button" onClick={() => removeMistake(mistake.id)} className="ml-auto text-[13px] font-semibold text-danger">
                Confirmar exclusão
              </button>
            ) : (
              <button type="button" onClick={() => setConfirmingRemove(true)} className="ml-auto text-[13px] text-muted underline underline-offset-3">
                Excluir
              </button>
            )}
          </div>
        </div>
      ) : (
        <div>
          <Button onClick={() => setRevealed(true)}>Tentar lembrar e ver a resposta</Button>
        </div>
      )}
    </li>
  );
}

export function MistakesScreen() {
  const hydrated = useHydrated();
  const mistakes = useStudyStore((state) => state.mistakes);
  const topics = useStudyStore((state) => state.topics);
  const [adding, setAdding] = useState(false);
  const pro = useProAccess();

  const header = <PageHeader title="Revisões" subtitle={SUBTITLE} />;
  if (!hydrated) {
    return (
      <div className="grid gap-6">
        {header}
        <Skeleton className="h-64" />
      </div>
    );
  }

  const today = toDateKey(new Date());
  const due = dueMistakes(mistakes, today);
  const upcoming = openMistakes(mistakes)
    .filter((mistake) => (mistake.due ?? "") > today)
    .sort((first, second) => (first.due ?? "").localeCompare(second.due ?? ""));
  const overcome = mistakes.length - openMistakes(mistakes).length;
  const main = mainReason(mistakes);

  // No gratuito, o que já foi registrado continua visível, só para leitura.
  if (!pro) {
    return (
      <div className="grid gap-6">
        {header}
        <RevisoesTabs current="/revisoes/erros" />
        <ProNotice title="O caderno de erros faz parte do Pro" className="max-w-2xl">
          Guarde as questões que errou, reveja cada uma em 1, 7, 15 e 30 dias e peça para a IA explicar onde o raciocínio desviou.
          {mistakes.length > 0 && " Os erros que você já registrou continuam guardados e aparecem abaixo só para leitura."}
        </ProNotice>
        {mistakes.length > 0 && (
          <Card flush>
            <CardHeader flush title="Seus erros">
              <span className="text-[13px] text-muted tabular-nums">{mistakes.length}</span>
            </CardHeader>
            <ul>
              {mistakes.map((mistake) => (
                <ListRow
                  key={mistake.id}
                  title={mistake.question}
                  subtitle={`${mistakeSubject(mistake, topics)} · ${MISTAKE_REASONS[mistake.reason].label}`}
                />
              ))}
            </ul>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {header}
      <RevisoesTabs current="/revisoes/erros" />

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" size="lg" onClick={() => setAdding(true)}>
          <Plus size={18} aria-hidden />
          Registrar erro
        </Button>
        {overcome > 0 && (
          <span className="text-sm text-muted tabular-nums">
            {overcome} {overcome === 1 ? "erro superado" : "erros superados"}
          </span>
        )}
      </div>

      {main && (
        <p className="text-sm">
          <strong>{MISTAKE_REASONS[main.reason].label}</strong> aparece em {main.count} dos seus {mistakes.length} erros.{" "}
          <span className="text-muted">{MISTAKE_REASONS[main.reason].tip}</span>
        </p>
      )}

      {mistakes.length === 0 ? (
        <Card flush>
          <EmptyState title="Seu caderno de erros está vazio">
            Registre as questões que errou. Cada uma volta até você acertar.
          </EmptyState>
        </Card>
      ) : (
        <>
          <Card flush>
            <CardHeader flush title="Para rever hoje">
              <span className="text-[13px] text-muted tabular-nums">{due.length}</span>
            </CardHeader>
            {due.length > 0 ? (
              <ul className="pb-2">
                {due.map((mistake) => (
                  <DueMistake key={mistake.id} mistake={mistake} topics={topics} />
                ))}
              </ul>
            ) : (
              <p className="px-5 pb-5 text-[13px] text-muted md:px-7">Nenhum erro para hoje. Os próximos estão abaixo.</p>
            )}
          </Card>

          {upcoming.length > 0 && (
            <Card flush>
              <CardHeader flush title="Próximos">
                <span className="text-[13px] text-muted tabular-nums">{upcoming.length}</span>
              </CardHeader>
              <ul>
                {upcoming.map((mistake) => (
                  <ListRow
                    key={mistake.id}
                    title={mistake.question}
                    subtitle={`${mistakeSubject(mistake, topics)} · ${MISTAKE_REASONS[mistake.reason].label}`}
                    end={
                      <span className="text-[13px] text-muted tabular-nums">
                        {mistake.due && <DueLabel due={mistake.due} today={today} />}
                      </span>
                    }
                  />
                ))}
              </ul>
            </Card>
          )}
        </>
      )}

      <Drawer open={adding} onClose={() => setAdding(false)} eyebrow="Caderno de erros" title="Registrar erro">
        {adding && (
          <MistakeForm
            onDone={(message) => {
              setAdding(false);
              showToast(message);
            }}
          />
        )}
      </Drawer>
    </div>
  );
}

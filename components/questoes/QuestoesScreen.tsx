"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { QuestionView } from "@/components/simulados/QuestionView";
import { Button, linkStyles } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Drawer } from "@/components/ui/Drawer";
import { Field, inputStyles } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProNotice } from "@/components/ui/ProNotice";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { showToast } from "@/components/ui/Toast";
import { shortDate } from "@/lib/dates";
import { findOfficialExam, type ExamQuestion, type ForeignLanguage } from "@/lib/official-exams";
import {
  BLOCK_SIZE,
  BLOCK_THEME_MAX,
  PRACTICE_AREAS,
  blockScore,
  blockWrongAnswers,
  dayOfArea,
  matchingQuestions,
  pickBlock,
  practiceStats,
  questionKey,
  seenQuestions,
  type BlockItem,
  type PoolQuestion,
  type PracticeArea,
  type QuestionBlock,
} from "@/lib/question-blocks";
import { topicSuggestions } from "@/lib/suggestions";
import { findArea, subjectsOf } from "@/lib/syllabus";
import { visibleTopics } from "@/lib/topics";
import { useProAccess } from "@/store/pro";
import { useHydrated, useStudyStore } from "@/store/study-store";
import { prefetchImages, usePracticePool } from "./use-practice-pool";

const SUBTITLE = "Blocos de 5 questões oficiais do Enem por área e tema, para treinar sem fazer a prova inteira.";
const THEME_CHIPS = 8;

// Seus tópicos da área primeiro; depois o que mais cai (em Natureza e Humanas, um pouco de cada matéria).
function themeChips(areaId: PracticeArea, topicNames: readonly string[]): string[] {
  const suggested =
    subjectsOf(areaId).length > 0
      ? subjectsOf(areaId).flatMap((subject) => (topicSuggestions(areaId, subject.id) ?? []).slice(0, 2))
      : [...(topicSuggestions(areaId, null) ?? [])];
  return [...new Set([...topicNames.slice(0, 4), ...suggested])].slice(0, THEME_CHIPS);
}

function questionsOfBlock(block: QuestionBlock, pool: readonly PoolQuestion[]): (ExamQuestion | null)[] {
  const byKey = new Map(pool.map((item) => [questionKey(item.examId, item.question.number), item.question]));
  return block.items.map((item) => byKey.get(questionKey(item.examId, item.number)) ?? null);
}

function itemSource(item: BlockItem): string {
  return `Enem ${findOfficialExam(item.examId)?.year ?? ""} · questão ${item.number}`;
}

function PoolMessage({ status, onRetry }: { status: "carregando" | "erro"; onRetry: () => void }) {
  if (status === "carregando") return <Skeleton className="h-48" />;
  return (
    <div className="grid justify-items-start gap-3 text-sm text-muted">
      <p>Não deu para carregar as questões. Confira a internet e tente de novo.</p>
      <Button onClick={onRetry}>Tentar de novo</Button>
    </div>
  );
}

function StartForm() {
  const topics = useStudyStore((state) => state.topics);
  const blocks = useStudyStore((state) => state.questionBlocks);
  const startBlock = useStudyStore((state) => state.startBlock);
  const [areaId, setAreaId] = useState<PracticeArea>("mat");
  const [theme, setTheme] = useState("");
  const [language, setLanguage] = useState<ForeignLanguage>("ingles");
  const [error, setError] = useState<string | null>(null);
  const [poolState, retry] = usePracticePool(dayOfArea(areaId), language);

  const topicNames = visibleTopics(topics)
    .filter((topic) => topic.areaId === areaId)
    .map((topic) => topic.name);
  const chips = themeChips(areaId, topicNames);
  const seen = seenQuestions(blocks);
  const matches = poolState.status === "pronto" ? matchingQuestions(poolState.pool, areaId, theme) : [];
  const fresh = matches.filter((item) => !seen.has(questionKey(item.examId, item.question.number))).length;

  const start = () => {
    const picked = pickBlock(matches, seen);
    const result = startBlock({ areaId, theme, language, picked });
    if (result) {
      setError(result);
      return;
    }
    prefetchImages(picked.map((item) => item.question));
    window.scrollTo({ top: 0 });
  };

  return (
    <Card>
      <CardHeader title="Novo bloco" />
      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <span className="text-[13px] font-semibold text-muted">Área</span>
          <Segmented
            wrap
            options={PRACTICE_AREAS.map((value) => ({ value, label: findArea(value).shortName }))}
            value={areaId}
            onChange={(value) => {
              setAreaId(value);
              setTheme("");
              setError(null);
            }}
          />
        </div>
        <Field label="Tema (opcional)" hint="Uma palavra ou assunto. Sem tema, vêm questões variadas da área." error={error}>
          <input
            value={theme}
            maxLength={BLOCK_THEME_MAX}
            onChange={(event) => {
              setTheme(event.target.value);
              setError(null);
            }}
            placeholder="Ex.: porcentagem, genética, modernismo"
            className={inputStyles}
          />
        </Field>
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2" aria-label="Sugestões de tema">
            {chips.map((chip) => (
              <button
                key={chip}
                type="button"
                aria-pressed={theme === chip}
                onClick={() => {
                  setTheme(theme === chip ? "" : chip);
                  setError(null);
                }}
                className="min-h-[34px] rounded-full border-2 border-transparent bg-hover px-3.5 text-sm font-semibold text-text hover:border-edge aria-pressed:border-edge aria-pressed:bg-action aria-pressed:text-on-action"
              >
                {chip}
              </button>
            ))}
          </div>
        )}
        {areaId === "lin" && (
          <div className="grid gap-1.5">
            <span className="text-[13px] font-semibold text-muted">Língua estrangeira</span>
            <Segmented
              options={[
                { value: "ingles" as const, label: "Inglês" },
                { value: "espanhol" as const, label: "Espanhol" },
              ]}
              value={language}
              onChange={setLanguage}
            />
          </div>
        )}
        {poolState.status === "pronto" ? (
          <p className="text-sm text-muted tabular-nums" aria-live="polite">
            {matches.length === 0
              ? "Nenhuma questão com esse tema nas provas do app. Tente outra palavra."
              : `${matches.length} ${matches.length === 1 ? "questão" : "questões"} com esse tema, ${fresh} que você ainda não fez.`}
          </p>
        ) : (
          <PoolMessage status={poolState.status} onRetry={retry} />
        )}
        <div>
          <Button variant="primary" size="lg" onClick={start} disabled={matches.length === 0}>
            Começar bloco de {Math.min(BLOCK_SIZE, Math.max(matches.length, 1))}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function BlockRunner({ block, onFinish }: { block: QuestionBlock; onFinish: (block: QuestionBlock) => void }) {
  const actions = useStudyStore.getState();
  const [poolState, retry] = usePracticePool(dayOfArea(block.areaId), block.language);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const index = block.current;
  const item = block.items[index];
  const last = index === block.items.length - 1;
  const blank = block.items.filter((candidate) => candidate.marked === null).length;

  const finish = () => {
    const finished = actions.finishBlock();
    if (finished) onFinish(finished);
  };

  const discard = () => {
    if (!confirmingDiscard) {
      setConfirmingDiscard(true);
      return;
    }
    actions.discardBlock();
    showToast("Bloco descartado.");
  };

  return (
    <Card>
      <div className="mb-4 grid gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="tabular-nums">
            Questão {index + 1} de {block.items.length}
          </h2>
          <span className="text-[13px] text-muted">
            {findArea(block.areaId).shortName}
            {block.theme && ` · ${block.theme}`}
          </span>
        </div>
        <div className="flex gap-2" role="group" aria-label="Questões do bloco">
          {block.items.map((candidate, position) => (
            <button
              key={candidate.number}
              type="button"
              aria-current={position === index ? "step" : undefined}
              aria-label={`Questão ${position + 1}${candidate.marked ? ", respondida" : ", em branco"}`}
              onClick={() => actions.goToBlockQuestion(position)}
              className={`grid size-9 place-items-center rounded-full border-2 text-sm font-semibold tabular-nums ${
                position === index
                  ? "border-edge bg-surface shadow-stamp"
                  : candidate.marked
                    ? "border-action bg-action text-on-action"
                    : "border-line text-muted"
              }`}
            >
              {position + 1}
            </button>
          ))}
        </div>
        <p className="text-[13px] text-muted">{itemSource(item)}. Prova e gabarito oficiais do Inep.</p>
      </div>

      {poolState.status === "pronto" ? (
        (() => {
          const question = questionsOfBlock(block, poolState.pool)[index];
          return question ? (
            <QuestionView
              question={question}
              mode={{ kind: "answer", marked: item.marked, onAnswer: (letter) => actions.answerBlockQuestion(index, letter) }}
            />
          ) : (
            <p className="text-sm text-muted">Esta questão não está mais disponível. Siga para a próxima.</p>
          );
        })()
      ) : (
        <PoolMessage status={poolState.status} onRetry={retry} />
      )}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button size="lg" onClick={() => actions.goToBlockQuestion(index - 1)} disabled={index === 0}>
          <ChevronLeft size={18} aria-hidden />
          Anterior
        </Button>
        {last ? (
          <Button variant="primary" size="lg" onClick={finish}>
            Corrigir{blank > 0 && ` (${blank} em branco)`}
          </Button>
        ) : (
          <Button variant="primary" size="lg" onClick={() => actions.goToBlockQuestion(index + 1)}>
            Próxima
            <ChevronRight size={18} aria-hidden />
          </Button>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        {!last && (
          <button type="button" onClick={finish} className={linkStyles}>
            Corrigir agora
          </button>
        )}
        <button type="button" onClick={discard} className={confirmingDiscard ? "font-semibold text-danger" : linkStyles}>
          {confirmingDiscard ? "Confirmar: descartar o bloco" : "Descartar bloco"}
        </button>
      </div>
    </Card>
  );
}

function BlockResult({ block, onClose }: { block: QuestionBlock; onClose: () => void }) {
  const addBlockMistakes = useStudyStore((state) => state.addBlockMistakes);
  const [poolState] = usePracticePool(dayOfArea(block.areaId), block.language);
  const [sent, setSent] = useState(false);
  const [reviewing, setReviewing] = useState<number | null>(null);
  const { correct, total } = blockScore(block);
  const wrong = blockWrongAnswers(block);
  const questions = poolState.status === "pronto" ? questionsOfBlock(block, poolState.pool) : null;

  const send = () => {
    const stems = Object.fromEntries(
      block.items.flatMap((item, position) => {
        const question = questions?.[position];
        return question ? [[questionKey(item.examId, item.number), question.stem || question.text]] : [];
      }),
    );
    const count = addBlockMistakes(block.id, stems);
    setSent(true);
    showToast(`${count} ${count === 1 ? "erro" : "erros"} no caderno. Eles voltam para revisão amanhã.`);
  };

  const reviewItem = reviewing === null ? null : block.items[reviewing];
  const reviewQuestion = reviewing === null ? null : (questions?.[reviewing] ?? null);

  return (
    <Card>
      <CardHeader title="Resultado do bloco" />
      <p className="font-heading text-[44px] leading-none font-extrabold tabular-nums font-stretch-115%">
        {correct} de {total}
      </p>
      <p className="mt-1.5 text-sm text-muted">
        {findArea(block.areaId).name}
        {block.theme && ` · ${block.theme}`}
      </p>
      <ul className="mt-5">
        {block.items.map((item, position) => {
          const right = item.marked === item.correct;
          return (
            <li key={item.number} className="flex items-center justify-between gap-3 border-t border-line py-2.5 text-sm first:border-t-0">
              <span className="tabular-nums">
                <strong className={right ? "text-success" : "text-danger"}>{right ? "Acertou" : "Errou"}</strong> ·{" "}
                {itemSource(item)}
                {item.marked === null && <span className="text-muted"> · em branco</span>}
              </span>
              {questions && (
                <button type="button" onClick={() => setReviewing(position)} className={linkStyles}>
                  Revisar
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {wrong.length > 0 && !sent && (
          <Button variant="primary" onClick={send}>
            Mandar {wrong.length === 1 ? "o erro" : `os ${wrong.length} erros`} para o caderno
          </Button>
        )}
        <Button onClick={onClose}>Novo bloco</Button>
      </div>
      <Drawer
        open={reviewing !== null}
        onClose={() => setReviewing(null)}
        eyebrow={reviewItem ? itemSource(reviewItem) : ""}
        title="Revisar questão"
      >
        {reviewItem && reviewQuestion && (
          <QuestionView question={reviewQuestion} mode={{ kind: "review", marked: reviewItem.marked, correct: reviewItem.correct }} />
        )}
      </Drawer>
    </Card>
  );
}

function BlockRow({ block }: { block: QuestionBlock }) {
  const removeBlock = useStudyStore((state) => state.removeBlock);
  const [confirming, setConfirming] = useState(false);
  const { correct, total } = blockScore(block);
  return (
    <li className="grid gap-1 border-t border-line py-2.5 text-sm first:border-t-0">
      <div className="flex justify-between gap-3">
        <span>
          {findArea(block.areaId).shortName}
          {block.theme && <span className="text-muted"> · {block.theme}</span>}
        </span>
        <span className="text-muted tabular-nums">
          {shortDate(block.date)} · {correct}/{total}
        </span>
      </div>
      <button
        type="button"
        onClick={() => (confirming ? removeBlock(block.id) : setConfirming(true))}
        className={`justify-self-start text-[13px] ${confirming ? "font-semibold text-danger" : "text-muted underline underline-offset-3"}`}
      >
        {confirming ? "Confirmar exclusão" : "Excluir"}
      </button>
    </li>
  );
}

function StatsCard({ blocks }: { blocks: readonly QuestionBlock[] }) {
  const finished = blocks.filter((block) => block.finished);
  if (finished.length === 0) return null;
  const recent = [...finished].reverse().slice(0, 5);
  return (
    <Card>
      <CardHeader title="Seus blocos">
        <span className="text-[13px] text-muted tabular-nums">{finished.length}</span>
      </CardHeader>
      <div className="grid gap-4">
        {practiceStats(finished)
          .filter((item) => item.total > 0)
          .map((item) => (
            <div key={item.areaId} className="grid gap-1.5">
              <div className="flex justify-between gap-3 text-sm">
                <span>{findArea(item.areaId).name}</span>
                <span className="text-muted tabular-nums">
                  {item.correct} de {item.total} · {Math.round((item.correct / item.total) * 100)}%
                </span>
              </div>
              <ProgressBar value={item.correct / item.total} thin label={`Acertos em ${findArea(item.areaId).name}`} />
            </div>
          ))}
      </div>
      <ul className="mt-5">
        {recent.map((block) => (
          <BlockRow key={block.id} block={block} />
        ))}
      </ul>
    </Card>
  );
}

export function QuestoesScreen() {
  const hydrated = useHydrated();
  const pro = useProAccess();
  const blocks = useStudyStore((state) => state.questionBlocks);
  const [resultId, setResultId] = useState<string | null>(null);

  if (!hydrated) {
    return (
      <div className="grid gap-6">
        <PageHeader title="Questões" subtitle={SUBTITLE} />
        <Skeleton className="h-80" />
      </div>
    );
  }

  const open = blocks.find((block) => !block.finished);
  const result = resultId ? blocks.find((block) => block.id === resultId) : undefined;

  return (
    <div className="grid gap-6">
      <PageHeader title="Questões" subtitle={SUBTITLE} />
      {!pro ? (
        <ProNotice title="Os blocos de questões fazem parte do Pro" className="max-w-2xl">
          Escolha a área e o tema e resolva 5 questões oficiais do Enem, corrigidas pelo gabarito do Inep. Os erros vão para o
          caderno com um toque.
        </ProNotice>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          {open ? (
            <BlockRunner
              block={open}
              onFinish={(finished) => {
                setResultId(finished.id);
                window.scrollTo({ top: 0 });
              }}
            />
          ) : result ? (
            <BlockResult block={result} onClose={() => setResultId(null)} />
          ) : (
            <StartForm />
          )}
          <StatsCard blocks={blocks} />
        </div>
      )}
    </div>
  );
}

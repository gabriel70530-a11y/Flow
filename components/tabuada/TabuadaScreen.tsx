"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { inputStyles } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  FAST_ANSWER_MS,
  MEMORIZED_STREAK,
  ROUND_SIZE,
  TABLES,
  buildRound,
  factKey,
  parseAnswer,
  tableProgress,
  type Fact,
} from "@/lib/times-table";
import { useHydrated, useStudyStore } from "@/store/study-store";

const SUBTITLE = "Até sair de cabeça.";

interface Round {
  queue: Fact[];
  total: number;
  firstTry: number;
  missed: Fact[];
}

function factText(fact: Fact): string {
  return `${fact.left} × ${fact.right}`;
}

function RoundCard({ round, onChange, onClose }: { round: Round; onChange: (round: Round) => void; onClose: () => void }) {
  const answerFact = useStudyStore((state) => state.answerFact);
  const [answer, setAnswer] = useState("");
  const [wrong, setWrong] = useState(false);
  const [shownAt, setShownAt] = useState(() => performance.now());
  const input = useRef<HTMLInputElement>(null);
  const fact = round.queue[0];
  const done = round.total - round.queue.length;

  useEffect(() => {
    input.current?.focus();
  }, [fact, wrong]);

  const next = (missed: boolean) => {
    const queue = round.queue.slice(1);
    // A conta errada volta uma vez no fim da rodada, para fixar.
    const alreadyMissed = round.missed.some((item) => factKey(item) === factKey(fact));
    onChange({
      ...round,
      queue: missed && !alreadyMissed ? [...queue, fact] : queue,
      firstTry: round.firstTry + (missed || alreadyMissed ? 0 : 1),
      missed: missed && !alreadyMissed ? [...round.missed, fact] : round.missed,
    });
    setAnswer("");
    setWrong(false);
    setShownAt(performance.now());
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (wrong) {
      next(true);
      return;
    }
    const value = parseAnswer(answer);
    if (value === null) return;
    const correct = value === fact.left * fact.right;
    answerFact(fact, correct, performance.now() - shownAt);
    if (correct) next(false);
    else setWrong(true);
  };

  if (!fact) {
    return (
      <Card>
        <CardHeader title="Rodada concluída" />
        <p className="font-heading text-[44px] leading-none font-extrabold tabular-nums font-stretch-115%">
          {round.firstTry} de {round.total}
        </p>
        <p className="mt-1.5 text-sm text-muted">acertadas de primeira.</p>
        {round.missed.length > 0 && (
          <p className="mt-4 text-sm">
            Para treinar mais:{" "}
            <span className="tabular-nums">
              {round.missed.map((item) => `${factText(item)} = ${item.left * item.right}`).join(" · ")}
            </span>
          </p>
        )}
        <Button className="mt-5" variant="primary" size="lg" onClick={onClose}>
          Nova rodada
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-3 text-[13px] text-muted tabular-nums">
        <span>
          {done} de {round.total}
        </span>
        <button type="button" onClick={onClose} className="underline underline-offset-3">
          Parar
        </button>
      </div>
      <ProgressBar value={done / round.total} thin />
      <form onSubmit={submit} className="mt-6 grid justify-items-center gap-4">
        <p className="font-heading text-[56px] leading-none font-extrabold tabular-nums font-stretch-115%" aria-live="polite">
          {factText(fact)}
        </p>
        <label className="grid w-full max-w-[220px] gap-1.5 text-center text-[13px] font-semibold text-muted">
          Resultado
          <input
            ref={input}
            value={answer}
            onChange={(event) => setAnswer(event.target.value.replace(/\D/g, "").slice(0, 3))}
            inputMode="numeric"
            autoComplete="off"
            readOnly={wrong}
            aria-invalid={wrong}
            className={`${inputStyles} h-14 text-center font-heading text-[28px] font-bold tabular-nums`}
          />
        </label>
        {wrong && (
          <p role="alert" className="text-center">
            <span className="font-semibold text-danger">Quase.</span> {factText(fact)} ={" "}
            <strong className="tabular-nums">{fact.left * fact.right}</strong>. Ela volta no fim da rodada.
          </p>
        )}
        <Button type="submit" variant="primary" size="lg" disabled={!wrong && parseAnswer(answer) === null}>
          {wrong ? "Continuar" : "Responder"}
        </Button>
      </form>
    </Card>
  );
}

export function TabuadaScreen() {
  const hydrated = useHydrated();
  const stats = useStudyStore((state) => state.timesTable);
  const [tables, setTables] = useState<number[]>([6, 7, 8, 9]);
  const [round, setRound] = useState<Round | null>(null);

  if (!hydrated) {
    return (
      <div className="grid gap-6">
        <PageHeader title="Tabuada" subtitle={SUBTITLE} />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const toggle = (table: number) =>
    setTables(tables.includes(table) ? tables.filter((item) => item !== table) : [...tables, table].sort((a, b) => a - b));

  const start = () => {
    const queue = buildRound(tables, stats);
    setRound({ queue, total: queue.length, firstTry: 0, missed: [] });
  };

  return (
    <div className="grid gap-6">
      <PageHeader title="Tabuada" subtitle={SUBTITLE} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {round ? (
          <RoundCard round={round} onChange={setRound} onClose={() => setRound(null)} />
        ) : (
          <Card>
            <CardHeader title="Nova rodada" />
            <div className="grid gap-4">
              <div className="grid gap-1.5">
                <span className="text-[13px] font-semibold text-muted">Quais tabuadas?</span>
                <div className="grid grid-cols-5 gap-2" role="group" aria-label="Tabuadas">
                  {TABLES.map((table) => (
                    <button
                      key={table}
                      type="button"
                      aria-pressed={tables.includes(table)}
                      onClick={() => toggle(table)}
                      className="h-11 rounded-full border-2 border-transparent bg-hover font-heading text-lg font-bold tabular-nums hover:border-edge aria-pressed:border-edge aria-pressed:bg-action aria-pressed:text-on-action"
                    >
                      {table}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted">
                {Math.min(ROUND_SIZE, tables.length * TABLES.length)} contas por rodada. Uma conta fica decorada depois de{" "}
                {MEMORIZED_STREAK} acertos seguidos em até {FAST_ANSWER_MS / 1000} segundos.
              </p>
              <div>
                <Button variant="primary" size="lg" onClick={start} disabled={tables.length === 0}>
                  Começar
                </Button>
              </div>
            </div>
          </Card>
        )}

        <Card>
          <CardHeader title="Decoradas" />
          <ul className="grid gap-3">
            {TABLES.map((table) => {
              const { memorized, total } = tableProgress(stats, table);
              return (
                <li key={table} className="grid gap-1">
                  <div className="flex justify-between gap-3 text-sm tabular-nums">
                    <span>Tabuada do {table}</span>
                    <span className="text-muted">
                      {memorized} de {total}
                    </span>
                  </div>
                  <ProgressBar value={memorized / total} thin label={`Decoradas na tabuada do ${table}`} />
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}

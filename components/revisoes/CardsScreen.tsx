"use client";

import { Plus, Upload } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { StudyOptions } from "@/components/timer/StudyOptions";
import { Button, linkStyles } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Drawer } from "@/components/ui/Drawer";
import { DueLabel } from "@/components/ui/DueLabel";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, inputStyles } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { showToast } from "@/components/ui/Toast";
import { toDateKey } from "@/lib/dates";
import {
  CARD_BACK_MAX,
  CARD_FRONT_MAX,
  CARD_GRADES,
  cardCounts,
  dueCards,
  intervalLabel,
  parseAnkiText,
  previewInterval,
  type CardGrade,
  type ImportedCards,
  type Flashcard,
} from "@/lib/flashcards";
import { GENERAL_STUDY, parseStudyChoice, studyTitle, studyValue } from "@/lib/sessions";
import { visibleTopics, type TopicRecord } from "@/lib/topics";
import { useHydrated, useStudyStore } from "@/store/study-store";
import { RevisoesTabs } from "./RevisoesTabs";

const SUBTITLE = "Cada cartão volta na hora certa.";

function cardSubject(card: Flashcard, topics: readonly TopicRecord[]): string {
  return card.areaId || card.topicId ? studyTitle(card.topicId, card.areaId, topics, card.subjectId) : "Sem assunto";
}

function CardForm({ card, onDone }: { card: Flashcard | null; onDone: (message: string) => void }) {
  const topics = useStudyStore((state) => state.topics);
  const { addCard, updateCard, removeCard } = useStudyStore.getState();
  const [choice, setChoice] = useState(card ? studyValue(card) : GENERAL_STUDY);
  const [front, setFront] = useState(card?.front ?? "");
  const [back, setBack] = useState(card?.back ?? "");
  const [error, setError] = useState<string | null>(null);
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const input = { front, back, ...parseStudyChoice(choice, topics) };
    const result = card ? updateCard(card.id, input) : addCard(input);
    if (result) {
      setError(result);
      return;
    }
    if (card) {
      onDone("Cartão salvo.");
      return;
    }
    // Criar vários seguidos é o comum: o formulário fica aberto, com o mesmo assunto.
    setFront("");
    setBack("");
    showToast("Cartão criado. Ele aparece para estudar hoje.");
  };

  return (
    <form onSubmit={submit} className="grid gap-5">
      <Field label="De qual assunto?">
        <select value={choice} onChange={(event) => setChoice(event.target.value)} className={inputStyles}>
          <option value={GENERAL_STUDY}>Sem assunto definido</option>
          <StudyOptions topics={visibleTopics(topics)} />
        </select>
      </Field>
      <Field label="Frente" error={error}>
        <textarea
          value={front}
          maxLength={CARD_FRONT_MAX}
          rows={3}
          onChange={(event) => {
            setFront(event.target.value);
            setError(null);
          }}
          placeholder="Ex.: Fórmula de Bhaskara"
          className={`${inputStyles} h-auto resize-none py-2`}
        />
      </Field>
      <Field label="Verso">
        <textarea
          value={back}
          maxLength={CARD_BACK_MAX}
          rows={4}
          onChange={(event) => {
            setBack(event.target.value);
            setError(null);
          }}
          placeholder="Ex.: x = (−b ± √Δ) / 2a, com Δ = b² − 4ac"
          className={`${inputStyles} h-auto resize-none py-2`}
        />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" size="lg">
          {card ? "Salvar cartão" : "Criar cartão"}
        </Button>
        {card && (
          <button
            type="button"
            onClick={() => {
              if (!confirmingRemove) {
                setConfirmingRemove(true);
                return;
              }
              removeCard(card.id);
              onDone("Cartão excluído.");
            }}
            className={confirmingRemove ? "text-sm font-semibold text-danger" : linkStyles}
          >
            {confirmingRemove ? "Confirmar exclusão" : "Excluir cartão"}
          </button>
        )}
      </div>
    </form>
  );
}

const IMPORT_FILE_MAX = 5 * 1024 * 1024;

function ImportForm({ onDone }: { onDone: (message: string) => void }) {
  const topics = useStudyStore((state) => state.topics);
  const importCards = useStudyStore((state) => state.importCards);
  const [choice, setChoice] = useState(GENERAL_STUDY);
  const [parsed, setParsed] = useState<ImportedCards | null>(null);
  const [error, setError] = useState<string | null>(null);

  const read = async (file: File | undefined) => {
    setParsed(null);
    setError(null);
    if (!file) return;
    if (file.size > IMPORT_FILE_MAX) {
      setError("O arquivo passa de 5 MB. Exporte um baralho menor.");
      return;
    }
    const result = parseAnkiText(await file.text());
    if (result.cards.length === 0) setError("Nenhum cartão com frente e verso neste arquivo. Confira se é a exportação em texto.");
    else setParsed(result);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!parsed) return;
    const { topicId, areaId, subjectId } = parseStudyChoice(choice, topics);
    const added = importCards(parsed.cards, { topicId, areaId, subjectId });
    const repeated = parsed.cards.length - added;
    onDone(
      `${added} ${added === 1 ? "cartão importado" : "cartões importados"}${repeated > 0 ? `, ${repeated} já existiam` : ""}.`,
    );
  };

  return (
    <form onSubmit={submit} className="grid gap-5">
      <p className="text-sm text-muted">
        No Anki: Arquivo › Exportar › Notas em texto simples (.txt). Imagens e áudios ficam de fora.
      </p>
      <Field label="Arquivo exportado do Anki" error={error}>
        <input
          type="file"
          accept=".txt,.csv,.tsv,text/plain,text/csv"
          onChange={(event) => void read(event.target.files?.[0])}
          className={`${inputStyles} h-auto py-2`}
        />
      </Field>
      <Field label="De qual assunto?">
        <select value={choice} onChange={(event) => setChoice(event.target.value)} className={inputStyles}>
          <option value={GENERAL_STUDY}>Sem assunto definido</option>
          <StudyOptions topics={visibleTopics(topics)} />
        </select>
      </Field>
      {parsed && (
        <p className="text-sm tabular-nums" aria-live="polite">
          {parsed.cards.length} {parsed.cards.length === 1 ? "cartão encontrado" : "cartões encontrados"}
          {parsed.skipped > 0 && `, ${parsed.skipped} sem frente ou verso (ou grandes demais) ficam de fora`}. Primeiro:{" "}
          <strong>{parsed.cards[0].front}</strong>
        </p>
      )}
      <div>
        <Button type="submit" variant="primary" size="lg" disabled={!parsed}>
          {parsed ? `Importar ${parsed.cards.length} ${parsed.cards.length === 1 ? "cartão" : "cartões"}` : "Importar"}
        </Button>
      </div>
    </form>
  );
}

// A fila é fixada ao começar: "Errei" manda o cartão para o fim e ele volta antes de terminar.
function StudySession({ initial, onClose }: { initial: string[]; onClose: () => void }) {
  const flashcards = useStudyStore((state) => state.flashcards);
  const topics = useStudyStore((state) => state.topics);
  const answerCard = useStudyStore((state) => state.answerCard);
  const [queue, setQueue] = useState(initial);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(0);
  const card = flashcards.find((candidate) => candidate.id === queue[0]) ?? null;

  const answer = (grade: CardGrade) => {
    if (!card) return;
    answerCard(card.id, grade);
    setRevealed(false);
    setQueue(grade === "errei" ? [...queue.slice(1), card.id] : queue.slice(1));
    if (grade !== "errei") setDone((value) => value + 1);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!card || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement) return;
      if (!revealed && (event.key === " " || event.key === "Enter")) {
        event.preventDefault();
        setRevealed(true);
        return;
      }
      const grade = revealed ? CARD_GRADES[Number(event.key) - 1] : undefined;
      if (grade) answer(grade.value);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!card) {
    return (
      <Card>
        <CardHeader title="Tudo revisado por hoje" />
        <p className="text-sm text-muted">
          {done} {done === 1 ? "cartão revisado" : "cartões revisados"}. Os próximos voltam nas datas certas.
        </p>
        <Button className="mt-4" onClick={onClose}>
          Fechar
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-[13px] text-muted">{cardSubject(card, topics)}</span>
        <span className="text-[13px] text-muted tabular-nums">
          {queue.length} {queue.length === 1 ? "restante" : "restantes"}
        </span>
      </div>
      <p className="text-center font-heading text-[22px] font-semibold whitespace-pre-line wrap-anywhere">{card.front}</p>
      {revealed ? (
        <>
          <p className="mt-5 rounded-[12px] bg-hover px-4 py-4 text-center whitespace-pre-line wrap-anywhere">{card.back}</p>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CARD_GRADES.map(({ value, label }, index) => (
              <Button
                key={value}
                variant={value === "bom" ? "primary" : "secondary"}
                size="lg"
                onClick={() => answer(value)}
                aria-keyshortcuts={String(index + 1)}
                className="flex-col gap-0"
              >
                {label}
                <span className="text-xs font-normal opacity-80">{intervalLabel(previewInterval(card, value))}</span>
              </Button>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-5 grid justify-items-center">
          <Button variant="primary" size="lg" onClick={() => setRevealed(true)} aria-keyshortcuts="Space">
            Mostrar resposta
          </Button>
        </div>
      )}
      <button type="button" onClick={onClose} className={`${linkStyles} mt-5 text-sm`}>
        Parar por hoje
      </button>
    </Card>
  );
}

export function CardsScreen() {
  const hydrated = useHydrated();
  const flashcards = useStudyStore((state) => state.flashcards);
  const topics = useStudyStore((state) => state.topics);
  const [editing, setEditing] = useState<Flashcard | "novo" | null>(null);
  const [importing, setImporting] = useState(false);
  const [session, setSession] = useState<string[] | null>(null);
  const [query, setQuery] = useState("");

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
  const due = dueCards(flashcards, today);
  const counts = cardCounts(flashcards);
  const search = query.trim().toLocaleLowerCase("pt-BR");
  const listed = [...flashcards]
    .filter((card) => !search || `${card.front} ${card.back}`.toLocaleLowerCase("pt-BR").includes(search))
    .sort((first, second) => first.due.localeCompare(second.due));

  return (
    <div className="grid gap-6">
      {header}
      <RevisoesTabs current="/revisoes/cartoes" />

      {session ? (
        <StudySession initial={session} onClose={() => setSession(null)} />
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          {due.length > 0 && (
            <Button variant="primary" size="lg" onClick={() => setSession(due.map((card) => card.id))}>
              Estudar {due.length} {due.length === 1 ? "cartão" : "cartões"}
            </Button>
          )}
          <Button variant={due.length > 0 ? "secondary" : "primary"} size="lg" onClick={() => setEditing("novo")}>
            <Plus size={18} aria-hidden />
            Novo cartão
          </Button>
          <Button size="lg" onClick={() => setImporting(true)}>
            <Upload size={18} aria-hidden />
            Importar do Anki
          </Button>
          {flashcards.length > 0 && (
            <span className="text-sm text-muted tabular-nums">
              {counts.fresh} novos · {counts.learning} aprendendo · {counts.mature} firmes
            </span>
          )}
        </div>
      )}

      {flashcards.length === 0 ? (
        <Card flush>
          <EmptyState title="Nenhum cartão ainda">
            Pergunta na frente, resposta no verso. Já usa o Anki? Importe seus baralhos.
          </EmptyState>
        </Card>
      ) : (
        <Card flush>
          <CardHeader flush title="Seus cartões">
            <span className="text-[13px] text-muted tabular-nums">{flashcards.length}</span>
          </CardHeader>
          <div className="px-5 pb-3 md:px-7">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar nos cartões"
              aria-label="Buscar nos cartões"
              className={inputStyles}
            />
          </div>
          <ul className="pb-2">
            {listed.map((card) => (
              <li key={card.id} className="border-t border-line first:border-t-0">
                <button
                  type="button"
                  onClick={() => setEditing(card)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left hover:bg-hover md:px-7"
                >
                  <span className="grid min-w-0 gap-0.5">
                    <span className="truncate font-medium">{card.front}</span>
                    <span className="truncate text-[13px] text-muted">{cardSubject(card, topics)}</span>
                  </span>
                  <span className="shrink-0 text-[13px] text-muted tabular-nums">
                    <DueLabel due={card.due} today={today} />
                  </span>
                </button>
              </li>
            ))}
            {listed.length === 0 && <li className="px-5 py-3 text-[13px] text-muted md:px-7">Nenhum cartão com esse texto.</li>}
          </ul>
        </Card>
      )}

      <Drawer open={importing} onClose={() => setImporting(false)} eyebrow="Cartões" title="Importar do Anki">
        {importing && (
          <ImportForm
            onDone={(message) => {
              setImporting(false);
              showToast(message);
            }}
          />
        )}
      </Drawer>
      <Drawer
        open={editing !== null}
        onClose={() => setEditing(null)}
        eyebrow="Cartões"
        title={editing === "novo" ? "Novo cartão" : "Editar cartão"}
      >
        {editing !== null && (
          <CardForm
            key={editing === "novo" ? "novo" : editing.id}
            card={editing === "novo" ? null : editing}
            onDone={(message) => {
              setEditing(null);
              showToast(message);
            }}
          />
        )}
      </Drawer>
    </div>
  );
}

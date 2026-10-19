"use client";

import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { useNow } from "@/components/timer/use-now";
import { Button, linkStyles } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Drawer } from "@/components/ui/Drawer";
import { Field, inputStyles } from "@/components/ui/Field";
import { ProNotice } from "@/components/ui/ProNotice";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Segmented } from "@/components/ui/Segmented";
import { showToast } from "@/components/ui/Toast";
import { MOCK_DAY_AREAS, QUESTIONS_PER_AREA } from "@/lib/mock-exams";
import {
  FOREIGN_QUESTIONS,
  LETTERS,
  OFFICIAL_EXAMS,
  answeredCount,
  draftSeconds,
  findOfficialExam,
  officialExamTitle,
  officialMinutes,
  questionNumber,
  scopeIndices,
  type ExamDraft,
  type ExamFormat,
  type ExamScope,
  type ForeignLanguage,
  type OfficialExam,
  type WrongAnswer,
} from "@/lib/official-exams";
import { formatDuration } from "@/lib/stats";
import { findArea } from "@/lib/syllabus";
import { clockText } from "@/lib/timer";
import { useProAccess } from "@/store/pro";
import { useStudyStore } from "@/store/study-store";
import type { ExamResult } from "./ExamRunner";
import { QuestionView } from "./QuestionView";

const PRO_BADGE = <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">Pro</span>;

function PdfLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${linkStyles} inline-flex items-center gap-1`}>
      {children}
      <ExternalLink size={14} aria-hidden />
    </a>
  );
}

function StartForm() {
  const startExam = useStudyStore((state) => state.startExam);
  const [examId, setExamId] = useState(OFFICIAL_EXAMS[0].id);
  const [language, setLanguage] = useState<ForeignLanguage>("ingles");
  const [scope, setScope] = useState<ExamScope>("dia");
  const [error, setError] = useState<string | null>(null);
  const exam = findOfficialExam(examId) ?? OFFICIAL_EXAMS[0];
  const areas = MOCK_DAY_AREAS[exam.day];
  const minutes = officialMinutes(exam.day, scope);

  const start = (format: ExamFormat) => {
    const result = startExam(exam.id, { language, format, scope });
    if (result) setError(result);
  };

  return (
    <div className="grid gap-4">
      <Field label="Prova" error={error}>
        <select
          value={examId}
          onChange={(event) => {
            setExamId(event.target.value);
            setScope("dia");
            setError(null);
          }}
          className={inputStyles}
        >
          {OFFICIAL_EXAMS.map((option) => (
            <option key={option.id} value={option.id}>
              {officialExamTitle(option)} ({MOCK_DAY_AREAS[option.day].map((areaId) => findArea(areaId).shortName).join(" e ")})
              {option.questionsUrl ? "" : " · só PDF"}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid gap-1.5">
        <span className="text-[13px] font-semibold text-muted">O que fazer</span>
        <Segmented
          wrap
          options={[
            { value: "dia" as ExamScope, label: "Prova inteira (90)" },
            ...areas.map((areaId) => ({ value: areaId as ExamScope, label: `Só ${findArea(areaId).shortName} (45)` })),
          ]}
          value={scope}
          onChange={setScope}
        />
      </div>
      {exam.day === 1 && scope !== areas[1] && (
        <div className="grid gap-1.5">
          <span className="text-[13px] font-semibold text-muted">Língua estrangeira (questões 1 a {FOREIGN_QUESTIONS})</span>
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
      <p className="text-sm text-muted">
        {exam.questionsUrl
          ? "As questões são as da prova oficial, na mesma ordem do caderno azul."
          : "Esta prova ainda não está no app: abra o PDF oficial, resolva e marque no cartão-resposta."}{" "}
        O tempo de referência é {formatDuration(minutes * 60)}
        {exam.day === 1 && scope === "dia" && ", com a redação"}. Você pode pausar e continuar depois, até em outro dia. Ao terminar,
        o Flow corrige pelo gabarito oficial do Inep.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="primary" size="lg" onClick={() => start(exam.questionsUrl ? "app" : "pdf")}>
          Começar
        </Button>
        {exam.questionsUrl ? (
          <button type="button" onClick={() => start("pdf")} className={linkStyles}>
            Prefiro o PDF e o cartão-resposta
          </button>
        ) : (
          <PdfLink href={exam.examUrl}>Abrir a prova (PDF do Inep)</PdfLink>
        )}
      </div>
    </div>
  );
}

function FinishControls({ missing, onFinish }: { missing: number; onFinish: () => void }) {
  const discardExam = useStudyStore((state) => state.discardExam);
  const [confirming, setConfirming] = useState<"terminar" | "descartar" | null>(null);

  if (confirming === "terminar") {
    return (
      <div className="grid gap-2 rounded-[12px] bg-hover p-3.5 text-sm">
        <p>{missing > 0 ? `Faltam ${missing} questões. As em branco contam como erro.` : "Tudo respondido. Corrigir agora?"}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={onFinish}>
            Corrigir agora
          </Button>
          <Button onClick={() => setConfirming(null)}>Voltar</Button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary" size="lg" onClick={() => setConfirming("terminar")}>
        Terminar e corrigir
      </Button>
      {confirming === "descartar" ? (
        <button type="button" onClick={discardExam} className="text-[13px] font-semibold text-danger">
          Confirmar: descartar sem salvar
        </button>
      ) : (
        <button type="button" onClick={() => setConfirming("descartar")} className="text-[13px] text-muted underline underline-offset-3">
          Descartar
        </button>
      )}
    </div>
  );
}

function useFinish(exam: OfficialExam, onResult: (result: ExamResult) => void) {
  return () => {
    const result = useStudyStore.getState().finishExam();
    if ("error" in result) showToast(result.error);
    else onResult({ ...result, exam, questions: null });
  };
}

// Simulado com as questões no app, pausado: mostra onde parou e volta para a prova.
function PausedExam({ draft, exam, onResult }: { draft: ExamDraft; exam: OfficialExam; onResult: (result: ExamResult) => void }) {
  const resumeExam = useStudyStore((state) => state.resumeExam);
  const indices = scopeIndices(exam.day, draft.scope);
  const answered = answeredCount(draft, indices);
  const finish = useFinish(exam, onResult);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid">
          <span className="font-semibold tabular-nums">Parou na questão {questionNumber(exam.day, draft.current)}</span>
          <span className="text-[13px] text-muted tabular-nums">
            {answered} de {indices.length} respondidas
            {draft.flagged.length > 0 && ` · ${draft.flagged.length} para rever`}
          </span>
        </div>
        <span className="font-heading text-[32px] leading-none font-light tabular-nums italic font-stretch-120%">
          {clockText(draftSeconds(draft, 0))}
        </span>
      </div>
      <Button variant="primary" size="lg" onClick={resumeExam} className="justify-self-start">
        Continuar o simulado
      </Button>
      <FinishControls missing={indices.length - answered} onFinish={finish} />
    </div>
  );
}

function AnswerSheet({ draft, exam, onResult }: { draft: ExamDraft; exam: OfficialExam; onResult: (result: ExamResult) => void }) {
  const { answerExam, pauseExam, resumeExam } = useStudyStore.getState();
  const running = draft.startedAt !== null;
  const now = useNow(running);
  const indices = scopeIndices(exam.day, draft.scope);
  const answered = answeredCount(draft, indices);
  const seconds = draftSeconds(draft, running ? Math.max(now, draft.startedAt ?? 0) : 0);
  const finish = useFinish(exam, onResult);
  const areas = MOCK_DAY_AREAS[exam.day].filter((areaId) => draft.scope === "dia" || draft.scope === areaId);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-heading text-[32px] leading-none font-light tabular-nums italic font-stretch-120%" aria-live="off">
          {clockText(seconds)}
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={running ? pauseExam : resumeExam}>{running ? "Pausar" : "Continuar"}</Button>
          <PdfLink href={exam.examUrl}>Abrir a prova</PdfLink>
        </div>
      </div>
      <p className="text-[13px] text-muted tabular-nums">
        {answered} de {indices.length} marcadas
        {exam.day === 1 && draft.scope !== "hum" && ` · questões 1 a ${FOREIGN_QUESTIONS} em ${draft.language === "ingles" ? "inglês" : "espanhol"}`}.
        Fica salvo neste aparelho se você fechar o app.
      </p>
      {areas.map((areaId) => {
        const part = MOCK_DAY_AREAS[exam.day].indexOf(areaId);
        return (
          <section key={areaId} className="grid gap-2" aria-label={findArea(areaId).name}>
            <h3 className="text-sm font-semibold">{findArea(areaId).name}</h3>
            <ol className="gap-x-6 sm:columns-2 xl:columns-3">
              {draft.answers.slice(part * QUESTIONS_PER_AREA, (part + 1) * QUESTIONS_PER_AREA).map((marked, offset) => {
                const index = part * QUESTIONS_PER_AREA + offset;
                const number = questionNumber(exam.day, index);
                return (
                  <li key={number} className="mb-1.5 flex break-inside-avoid items-center gap-1.5" role="group" aria-label={`Questão ${number}`}>
                    <span className="w-9 text-right text-sm font-semibold tabular-nums">{String(number).padStart(2, "0")}</span>
                    {LETTERS.map((letter) => (
                      <button
                        key={letter}
                        type="button"
                        aria-pressed={marked === letter}
                        aria-label={`Questão ${number}, alternativa ${letter}`}
                        onClick={() => answerExam(index, marked === letter ? null : letter)}
                        className={`size-9 rounded-full border-2 text-sm font-semibold ${marked === letter ? "border-edge bg-action text-on-action" : "border-line bg-surface"}`}
                      >
                        {letter}
                      </button>
                    ))}
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
      <FinishControls missing={indices.length - answered} onFinish={finish} />
    </div>
  );
}

const scoreFormat = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function Result({ result, onClose }: { result: ExamResult; onClose: () => void }) {
  const addExamMistakes = useStudyStore((state) => state.addExamMistakes);
  const [sent, setSent] = useState(false);
  const [reviewing, setReviewing] = useState<WrongAnswer | null>(null);
  const { graded, exam, questions } = result;
  const questionOf = (number: number) => questions?.find((question) => question.number === number) ?? null;

  const send = () => {
    const stems = Object.fromEntries(
      graded.wrong.flatMap((item) => {
        const question = questionOf(item.number);
        return question ? [[item.number, question.stem || question.text]] : [];
      }),
    );
    const count = addExamMistakes(exam.id, graded.wrong, stems);
    setSent(true);
    showToast(`${count} erros no caderno. Eles voltam para revisão amanhã.`);
  };

  const reviewQuestion = reviewing && questionOf(reviewing.number);

  return (
    <div className="grid gap-5">
      <div className="grid gap-4">
        {graded.sections.map((section) => (
          <div key={section.areaId} className="grid gap-1.5">
            <div className="flex justify-between gap-3 text-sm">
              <span>{findArea(section.areaId).name}</span>
              <span className="text-muted tabular-nums">
                {section.correct} de {section.total}
                {section.score !== undefined && (
                  <>
                    {" · "}
                    <strong className="text-text">{scoreFormat.format(section.score)}</strong>
                  </>
                )}
              </span>
            </div>
            <ProgressBar value={section.correct / section.total} thin label={`Acertos em ${findArea(section.areaId).name}`} />
          </div>
        ))}
      </div>
      {graded.annulled.length > 0 && (
        <p className="text-[13px] text-muted tabular-nums">Questão anulada pelo Inep, fora da conta: {graded.annulled.join(", ")}.</p>
      )}
      <p className="text-[13px] text-muted">
        Nota estimada pela TRI, com os parâmetros oficiais do Inep. Registrado em Seus simulados.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {graded.wrong.length > 0 && !sent && (
          <Button variant="primary" onClick={send}>
            Mandar os {graded.wrong.length} erros para o caderno
          </Button>
        )}
        <PdfLink href={exam.keyUrl}>Ver o gabarito oficial</PdfLink>
        <Button onClick={onClose}>Fechar</Button>
      </div>

      {questions && graded.wrong.length > 0 && (
        <section className="grid gap-1 border-t border-line pt-4" aria-label="Questões erradas">
          <h3 className="text-sm font-semibold">Questões erradas · {graded.wrong.length}</h3>
          <ul>
            {graded.wrong.map((item) => (
              <li key={item.number} className="flex items-center justify-between gap-3 border-t border-line py-2.5 text-sm first:border-t-0">
                <span className="tabular-nums">
                  <strong>{item.number}</strong> · {findArea(item.areaId).shortName}
                  {item.marked === null && <span className="text-muted"> · em branco</span>}
                </span>
                <button type="button" onClick={() => setReviewing(item)} className={linkStyles}>
                  Revisar
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Drawer
        open={reviewing !== null}
        onClose={() => setReviewing(null)}
        eyebrow={reviewing ? `${officialExamTitle(exam)} · questão ${reviewing.number}` : ""}
        title="Revisar questão"
      >
        {reviewing && reviewQuestion && (
          <QuestionView question={reviewQuestion} mode={{ kind: "review", marked: reviewing.marked, correct: reviewing.correct }} />
        )}
      </Drawer>
    </div>
  );
}

interface OfficialExamCardProps {
  result: ExamResult | null;
  onResult: (result: ExamResult) => void;
  onCloseResult: () => void;
}

export function OfficialExamCard({ result, onResult, onCloseResult }: OfficialExamCardProps) {
  const pro = useProAccess();
  const draft = useStudyStore((state) => state.examDraft);
  const exam = draft ? findOfficialExam(draft.examId) : null;

  const title = result
    ? `Resultado · ${officialExamTitle(result.exam)}`
    : exam && draft
      ? `${officialExamTitle(exam)}${draft.scope === "dia" ? "" : ` · ${findArea(draft.scope).shortName}`}`
      : "Simulado no app";

  return (
    <Card>
      <CardHeader title={title}>{PRO_BADGE}</CardHeader>
      {result ? (
        <Result result={result} onClose={onCloseResult} />
      ) : draft && exam ? (
        draft.format === "app" ? (
          <PausedExam draft={draft} exam={exam} onResult={onResult} />
        ) : (
          <AnswerSheet draft={draft} exam={exam} onResult={onResult} />
        )
      ) : pro ? (
        <StartForm />
      ) : (
        <div className="grid gap-3">
          <ProNotice title="Faça o simulado no Flow com o Pro">
            As questões da prova oficial na tela, com cronômetro, correção pelo gabarito oficial do Inep, acertos por área e as
            questões erradas direto para o caderno de erros.
          </ProNotice>
          <p className="text-[13px] text-muted">Você continua podendo registrar os acertos de um simulado feito fora do app.</p>
        </div>
      )}
    </Card>
  );
}

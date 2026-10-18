"use client";

import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { useNow } from "@/components/timer/use-now";
import { Button, linkStyles } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, inputStyles } from "@/components/ui/Field";
import { ProNotice } from "@/components/ui/ProNotice";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Segmented } from "@/components/ui/Segmented";
import { showToast } from "@/components/ui/Toast";
import { MOCK_DAY_AREAS, MOCK_DAY_MINUTES, QUESTIONS_PER_AREA } from "@/lib/mock-exams";
import {
  FOREIGN_QUESTIONS,
  LETTERS,
  OFFICIAL_EXAMS,
  draftSeconds,
  findOfficialExam,
  officialExamTitle,
  questionNumber,
  type ExamDraft,
  type ForeignLanguage,
  type GradedExam,
  type OfficialExam,
} from "@/lib/official-exams";
import { formatDuration } from "@/lib/stats";
import { findArea } from "@/lib/syllabus";
import { clockText } from "@/lib/timer";
import { useProAccess } from "@/store/pro";
import { useStudyStore } from "@/store/study-store";

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
  const [error, setError] = useState<string | null>(null);
  const exam = findOfficialExam(examId) ?? OFFICIAL_EXAMS[0];

  return (
    <div className="grid gap-4">
      <Field label="Prova" error={error}>
        <select value={examId} onChange={(event) => setExamId(event.target.value)} className={inputStyles}>
          {OFFICIAL_EXAMS.map((option) => (
            <option key={option.id} value={option.id}>
              {officialExamTitle(option)} ({option.booklet})
            </option>
          ))}
        </select>
      </Field>
      {exam.day === 1 && (
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
        Abra a prova oficial, resolva no papel ou na tela e marque aqui. O tempo oficial é{" "}
        {formatDuration(MOCK_DAY_MINUTES[exam.day] * 60)}
        {exam.day === 1 && ", com a redação"}. Ao terminar, o Flow corrige pelo gabarito oficial do Inep.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <Button
          variant="primary"
          size="lg"
          onClick={() => {
            const result = startExam(exam.id, language);
            if (result) setError(result);
          }}
        >
          Começar o simulado
        </Button>
        <PdfLink href={exam.examUrl}>Abrir a prova (PDF do Inep)</PdfLink>
      </div>
    </div>
  );
}

function AnswerSheet({ draft, exam, onFinish }: { draft: ExamDraft; exam: OfficialExam; onFinish: (graded: GradedExam) => void }) {
  const { answerExam, pauseExam, resumeExam, discardExam, finishExam } = useStudyStore.getState();
  const running = draft.startedAt !== null;
  const now = useNow(running);
  const [confirming, setConfirming] = useState<"terminar" | "descartar" | null>(null);
  const answered = draft.answers.filter(Boolean).length;
  const seconds = draftSeconds(draft, running ? Math.max(now, draft.startedAt ?? 0) : 0);

  const finish = () => {
    const result = finishExam();
    if ("error" in result) showToast(result.error);
    else onFinish(result.graded);
  };

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
        {answered} de {draft.answers.length} marcadas
        {exam.day === 1 && ` · questões 1 a ${FOREIGN_QUESTIONS} em ${draft.language === "ingles" ? "inglês" : "espanhol"}`}. Fica
        salvo neste aparelho se você fechar o app.
      </p>
      {MOCK_DAY_AREAS[exam.day].map((areaId, part) => (
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
      ))}
      {confirming === "terminar" ? (
        <div className="grid gap-2 rounded-[12px] bg-hover p-3.5 text-sm">
          <p>
            {answered < draft.answers.length
              ? `Faltam ${draft.answers.length - answered} questões. As em branco contam como erro.`
              : "Tudo marcado. Corrigir agora?"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={finish}>
              Corrigir agora
            </Button>
            <Button onClick={() => setConfirming(null)}>Voltar</Button>
          </div>
        </div>
      ) : (
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
      )}
    </div>
  );
}

function Result({ graded, exam, onClose }: { graded: GradedExam; exam: OfficialExam; onClose: () => void }) {
  const addExamMistakes = useStudyStore((state) => state.addExamMistakes);
  const [sent, setSent] = useState(false);

  return (
    <div className="grid gap-4">
      {graded.sections.map((section) => (
        <div key={section.areaId} className="grid gap-1.5">
          <div className="flex justify-between gap-3 text-sm">
            <span>{findArea(section.areaId).name}</span>
            <span className="text-muted tabular-nums">
              {section.correct} de {section.total} · {Math.round((section.correct / section.total) * 100)}%
            </span>
          </div>
          <ProgressBar value={section.correct / section.total} thin label={`Acertos em ${findArea(section.areaId).name}`} />
        </div>
      ))}
      {graded.annulled.length > 0 && (
        <p className="text-[13px] text-muted tabular-nums">
          Questão anulada pelo Inep, fora da conta: {graded.annulled.join(", ")}.
        </p>
      )}
      <p className="text-[13px] text-muted">Registrado em Seus simulados. O Flow mostra acertos, não nota TRI.</p>
      <div className="flex flex-wrap items-center gap-3">
        {graded.wrong.length > 0 && !sent && (
          <Button
            variant="primary"
            onClick={() => {
              const count = addExamMistakes(exam.id, graded.wrong);
              setSent(true);
              showToast(`${count} erros no caderno. Eles voltam para revisão amanhã.`);
            }}
          >
            Mandar os {graded.wrong.length} erros para o caderno
          </Button>
        )}
        <PdfLink href={exam.keyUrl}>Ver o gabarito oficial</PdfLink>
        <Button onClick={onClose}>Fechar</Button>
      </div>
    </div>
  );
}

export function OfficialExamCard() {
  const pro = useProAccess();
  const draft = useStudyStore((state) => state.examDraft);
  const [result, setResult] = useState<{ graded: GradedExam; exam: OfficialExam } | null>(null);
  const exam = draft ? findOfficialExam(draft.examId) : null;

  const title = result ? `Resultado · ${officialExamTitle(result.exam)}` : exam ? `${officialExamTitle(exam)} · ${exam.booklet}` : "Simulado no app";

  return (
    <Card>
      <CardHeader title={title}>{PRO_BADGE}</CardHeader>
      {result ? (
        <Result graded={result.graded} exam={result.exam} onClose={() => setResult(null)} />
      ) : draft && exam ? (
        <AnswerSheet draft={draft} exam={exam} onFinish={(graded) => setResult({ graded, exam })} />
      ) : pro ? (
        <StartForm />
      ) : (
        <div className="grid gap-3">
          <ProNotice title="Faça o simulado no Flow com o Pro">
            Cartão-resposta com cronômetro, correção pelo gabarito oficial do Inep, acertos por área e as questões erradas direto
            para o caderno de erros.
          </ProNotice>
          <p className="text-[13px] text-muted">Você continua podendo registrar os acertos de um simulado feito fora do app.</p>
        </div>
      )}
    </Card>
  );
}

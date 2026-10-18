"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, inputStyles } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { StudyOptions } from "@/components/timer/StudyOptions";
import {
  MISTAKE_LESSON_MAX,
  MISTAKE_QUESTION_MAX,
  MISTAKE_REASONS,
  MISTAKE_SOURCE_MAX,
  type MistakeReason,
} from "@/lib/mistakes";
import { GENERAL_STUDY, parseStudyChoice } from "@/lib/sessions";
import { findTopic, findTopicByName, visibleTopics } from "@/lib/topics";
import type { MistakeAnalysis } from "@/store/cloud";
import { useStudyStore } from "@/store/study-store";
import { AiMistakeHelper } from "./AiMistakeHelper";

const reasonOptions = (Object.keys(MISTAKE_REASONS) as MistakeReason[]).map((value) => ({
  value,
  label: MISTAKE_REASONS[value].label,
}));

interface MistakeFormProps {
  initialChoice?: string;
  onDone: (message: string) => void;
}

// Depois de salvar, se o tópico já acumula erros, pergunta se ele deve virar "Precisa revisar". A pessoa decide.
export function MistakeForm({ initialChoice = GENERAL_STUDY, onDone }: MistakeFormProps) {
  const topics = useStudyStore((state) => state.topics);
  const { addMistake, setStatus } = useStudyStore.getState();
  const [choice, setChoice] = useState(initialChoice);
  const [reason, setReason] = useState<MistakeReason>("conteudo");
  const [question, setQuestion] = useState("");
  const [lesson, setLesson] = useState("");
  const [source, setSource] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [suggestTopicId, setSuggestTopicId] = useState<string | null>(null);

  const fillFromAi = (analysis: MistakeAnalysis) => {
    const answer = analysis.answer ? `Resposta: ${analysis.answer}. ` : "";
    setQuestion(analysis.question.slice(0, MISTAKE_QUESTION_MAX));
    setLesson(`${answer}${analysis.lesson}`.slice(0, MISTAKE_LESSON_MAX));
    setReason(analysis.reason);
    setError(null);
    const topic = findTopicByName(topics, analysis.topic);
    if (choice === GENERAL_STUDY && topic) setChoice(topic.id);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const studyChoice = parseStudyChoice(choice, topics);
    const result = addMistake({ ...studyChoice, reason, question, lesson, source });
    if ("error" in result) {
      setError(result.error);
      return;
    }
    if (result.suggestReview && studyChoice.topicId) setSuggestTopicId(studyChoice.topicId);
    else onDone("Erro registrado. Ele volta para revisão amanhã.");
  };

  const suggestedTopic = findTopic(topics, suggestTopicId);
  if (suggestedTopic) {
    return (
      <div className="grid gap-4">
        <p>
          Erro registrado. Você já tem mais de um erro em aberto em <strong>{suggestedTopic.name}</strong>. Quer marcar o tópico
          como Precisa revisar? Ele ganha prioridade no plano.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            onClick={() => {
              setStatus(suggestedTopic.id, "revisar");
              onDone("Tópico marcado como Precisa revisar.");
            }}
          >
            Marcar como Precisa revisar
          </Button>
          <Button onClick={() => onDone("Erro registrado.")}>Agora não</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      <AiMistakeHelper onResult={fillFromAi} />
      <Field label="De qual assunto?">
        <select value={choice} onChange={(event) => setChoice(event.target.value)} className={inputStyles}>
          <option value={GENERAL_STUDY}>Sem assunto definido</option>
          <StudyOptions topics={visibleTopics(topics)} />
        </select>
      </Field>
      <Field label="O que a questão pedia ou onde você errou?" error={error}>
        <textarea
          value={question}
          maxLength={MISTAKE_QUESTION_MAX}
          rows={3}
          onChange={(event) => {
            setQuestion(event.target.value);
            setError(null);
          }}
          placeholder="Ex.: calcular o desconto de 15% sobre um produto já com aumento"
          className={`${inputStyles} h-auto resize-none py-2`}
          aria-invalid={Boolean(error)}
        />
      </Field>
      <div className="grid gap-1.5">
        <span className="text-[13px] font-semibold text-muted">Por que errou?</span>
        <Segmented wrap options={reasonOptions} value={reason} onChange={setReason} />
        <span className="text-[13px] text-muted">{MISTAKE_REASONS[reason].tip}</span>
      </div>
      <Field label="O que aprendi (opcional)" hint="A resposta certa ou o raciocínio. Aparece quando você revisar.">
        <textarea
          value={lesson}
          maxLength={MISTAKE_LESSON_MAX}
          rows={3}
          onChange={(event) => setLesson(event.target.value)}
          className={`${inputStyles} h-auto resize-none py-2`}
        />
      </Field>
      <Field label="Origem (opcional)">
        <input
          value={source}
          maxLength={MISTAKE_SOURCE_MAX}
          onChange={(event) => setSource(event.target.value)}
          placeholder="Ex.: Enem 2023, questão 151"
          className={inputStyles}
        />
      </Field>
      <Button type="submit" variant="primary" size="lg">
        Salvar erro
      </Button>
    </form>
  );
}

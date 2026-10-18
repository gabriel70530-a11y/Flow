"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CheckRow } from "@/components/ui/CheckRow";
import { inputStyles } from "@/components/ui/Field";
import { TopicForm } from "@/components/materias/TopicForm";
import { STATUS_LABELS, progressOf } from "@/lib/reviews";
import { AREAS, SUBJECTS, focusName } from "@/lib/syllabus";
import { visibleTopics, type TopicRecord } from "@/lib/topics";
import { useStudyStore } from "@/store/study-store";

const NEW_TOPIC = { name: "", areaId: "mat", subjectId: null, description: "", priority: "media" } as const;

// Mesma ordem da tela de Matérias: por área e, em Natureza e Humanas, por matéria.
function subjectOrder(topic: TopicRecord): number {
  const area = AREAS.findIndex((item) => item.id === topic.areaId);
  return area * 10 + (SUBJECTS.findIndex((item) => item.id === topic.subjectId) + 1);
}

function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("pt-BR");
}

// O que a pessoa já estudou fora do plano: marca como Concluído e as revisões entram a partir de hoje.
export function ScheduleReviewsForm({ onDone }: { onDone: (count: number) => void }) {
  const topics = useStudyStore((state) => state.topics);
  const progress = useStudyStore((state) => state.progress);
  const { addTopic, markStudied } = useStudyStore.getState();
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const candidates = visibleTopics(topics)
    .filter((topic) => progressOf(progress, topic.id).status !== "concluido")
    .sort((first, second) => subjectOrder(first) - subjectOrder(second));
  const [creating, setCreating] = useState(candidates.length === 0);

  const terms = normalize(query.trim());
  const shown = candidates.filter((topic) => !terms || normalize(topic.name).includes(terms) || selected.includes(topic.id));
  const groups = new Map<string, TopicRecord[]>();
  for (const topic of shown) {
    const group = focusName(topic.areaId, topic.subjectId);
    groups.set(group, [...(groups.get(group) ?? []), topic]);
  }

  const toggle = (topicId: string) =>
    setSelected((current) => (current.includes(topicId) ? current.filter((id) => id !== topicId) : [...current, topicId]));

  return (
    <div className="grid gap-5">
      <p className="text-sm text-muted">
        Marque o que você já estudou. Cada tópico vira Concluído e ganha revisões em 1, 7, 15 e 30 dias a partir de hoje.
      </p>

      {candidates.length > 6 && (
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar tópico"
          aria-label="Buscar tópico"
          className={`${inputStyles} rounded-full px-4`}
        />
      )}

      {[...groups.entries()].map(([group, list]) => (
        <section key={group} className="grid gap-1">
          <h3 className="text-xs font-semibold tracking-[0.08em] text-muted uppercase">{group}</h3>
          <ul className="grid">
            {list.map((topic) => (
              <li key={topic.id}>
                <CheckRow
                  checked={selected.includes(topic.id)}
                  onToggle={() => toggle(topic.id)}
                  label={topic.name}
                  hint={STATUS_LABELS[progressOf(progress, topic.id).status]}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {candidates.length > 0 && shown.length === 0 && <p className="text-[13px] text-muted">Nenhum tópico com esse nome.</p>}

      {creating ? (
        <div className="grid gap-3 border-t border-line pt-4">
          <h3 className="text-[13px] font-semibold text-muted">
            {candidates.length === 0 ? "Crie o tópico que você já estudou" : "Novo tópico"}
          </h3>
          <TopicForm
            initial={NEW_TOPIC}
            submitLabel="Criar e marcar"
            suggest
            onCancel={candidates.length ? () => setCreating(false) : undefined}
            onSubmit={(input) => {
              const result = addTopic(input);
              if ("error" in result) return result.error;
              setSelected((current) => [...current, result.id]);
              setCreating(false);
              return null;
            }}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex min-h-9 items-center gap-1.5 justify-self-start rounded-full px-3 text-sm font-semibold text-muted hover:bg-hover hover:text-text"
        >
          <Plus size={16} aria-hidden />
          Não está na lista? Criar tópico
        </button>
      )}

      <Button
        variant="primary"
        size="lg"
        disabled={selected.length === 0}
        onClick={() => onDone(markStudied(selected))}
      >
        {selected.length === 0
          ? "Escolha o que você já estudou"
          : `Agendar revisões de ${selected.length} ${selected.length === 1 ? "tópico" : "tópicos"}`}
      </Button>
    </div>
  );
}

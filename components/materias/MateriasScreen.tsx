"use client";

import { ChevronDown, EyeOff, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Drawer } from "@/components/ui/Drawer";
import { DueLabel } from "@/components/ui/DueLabel";
import { EmptyState } from "@/components/ui/EmptyState";
import { inputStyles } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { showToast } from "@/components/ui/Toast";
import { toDateKey } from "@/lib/dates";
import { STATUS_LABELS, nextReview, progressOf, type TopicStatus } from "@/lib/reviews";
import { AREAS, subjectsOf, type AreaId, type SubjectId } from "@/lib/syllabus";
import {
  EMPTY_FILTER,
  PRIORITY_LABELS,
  filterTopics,
  findTopic,
  sortTopics,
  visibleTopics,
  type Priority,
  type TopicFilter,
  type TopicRecord,
  type TopicSort,
} from "@/lib/topics";
import { useHydrated, useStudyStore } from "@/store/study-store";
import { ManageTopicsDrawer } from "./ManageTopicsDrawer";
import { TopicDrawer } from "./TopicDrawer";
import { TopicForm } from "./TopicForm";

const HINT = "Você decide o que estudar: crie os tópicos de cada área e toque em um para atualizar.";

const SORT_LABELS: Record<TopicSort, string> = {
  criacao: "Criação",
  nome: "Nome",
  prioridade: "Prioridade",
  status: "Status",
  revisao: "Revisão",
};

const selectStyles = `${inputStyles} md:w-auto`;
const addStyles =
  "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-muted hover:bg-hover hover:text-text";

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function joinNames(names: string[]): string {
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} e ${names.at(-1)}` : (names[0] ?? "");
}

export function MateriasScreen() {
  const hydrated = useHydrated();
  const progress = useStudyStore((state) => state.progress);
  const allTopics = useStudyStore((state) => state.topics);
  const addTopic = useStudyStore((state) => state.addTopic);
  const [filter, setFilter] = useState<TopicFilter>(EMPTY_FILTER);
  const [sort, setSort] = useState<TopicSort>("criacao");
  const [showFilters, setShowFilters] = useState(false);
  // Áreas abertas. Começa só com a primeira que tem tópicos, para a tela abrir limpa.
  const [openAreas, setOpenAreas] = useState<AreaId[] | null>(null);
  const [openTopicId, setOpenTopicId] = useState<string | null>(null);
  const [creatingIn, setCreatingIn] = useState<{ areaId: AreaId; subjectId: SubjectId | null } | null>(null);
  const [managing, setManaging] = useState(false);
  const closeDrawer = useCallback(() => setOpenTopicId(null), []);
  const updateFilter = (changes: Partial<TopicFilter>) => setFilter({ ...filter, ...changes });

  if (!hydrated) {
    return (
      <div className="grid gap-6">
        <PageHeader title="Matérias" subtitle={HINT} />
        <Skeleton className="h-11" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const today = toDateKey(new Date());
  const visible = visibleTopics(allTopics);
  const hiddenCount = allTopics.length - visible.length;
  const concluded = visible.filter((topic) => progressOf(progress, topic.id).status === "concluido").length;
  const matches = sortTopics(filterTopics(allTopics, progress, filter), progress, sort);
  const filtering = JSON.stringify(filter) !== JSON.stringify(EMPTY_FILTER);
  // Só a área escolhida ainda mostra todas as áreas, inclusive vazias; busca, status e prioridade escondem as sem resultado.
  const narrowing = filter.query.trim() !== "" || filter.status !== "todos" || filter.priority !== "todas";
  const areaFilters = [{ id: "todas" as const, shortName: "Todas" }, ...AREAS];
  const summary = visible.length
    ? `${plural(visible.length, "tópico", "tópicos")} · ${plural(concluded, "concluído", "concluídos")}${hiddenCount ? ` · ${plural(hiddenCount, "oculto", "ocultos")}` : ""}`
    : "As cinco áreas do ENEM, com Natureza e Humanas divididas em matérias. Crie os tópicos que você quer estudar.";

  const defaultOpen = AREAS.find((area) => visible.some((topic) => topic.areaId === area.id))?.id;
  const opened = openAreas ?? (defaultOpen ? [defaultOpen] : []);
  // Buscando ou filtrando por uma área, os resultados aparecem abertos.
  const isOpen = (areaId: AreaId) => narrowing || filter.areaId === areaId || opened.includes(areaId);
  const toggleArea = (areaId: AreaId) =>
    setOpenAreas(isOpen(areaId) ? opened.filter((id) => id !== areaId) : [...opened, areaId]);
  const startCreating = (areaId: AreaId, subjectId: SubjectId | null) => {
    setCreatingIn({ areaId, subjectId });
    if (!opened.includes(areaId)) setOpenAreas([...opened, areaId]);
  };

  const renderTopics = (list: TopicRecord[]) => (
    <ul className="-mx-3.5">
      {list.map((topic) => {
        const topicProgress = progressOf(progress, topic.id);
        const review = nextReview(topicProgress);
        const details = [
          topic.priority !== "media" && `Prioridade ${PRIORITY_LABELS[topic.priority].toLowerCase()}`,
          topicProgress.mastery > 0 && `Nível ${topicProgress.mastery}`,
        ].filter(Boolean);
        return (
          <li key={topic.id}>
            <button
              type="button"
              onClick={() => setOpenTopicId(topic.id)}
              className="flex w-full items-center gap-3 rounded-[12px] px-3.5 py-3 text-left hover:bg-hover"
            >
              <span className="min-w-0 flex-1">
                <span className="block wrap-anywhere">{topic.name}</span>
                {(review || details.length > 0) && (
                  <span className="block text-[13px] text-muted">
                    {details.join(" · ")}
                    {review && details.length > 0 && " · "}
                    {review && (
                      <>
                        Revisão {review.stage}: <DueLabel due={review.due} today={today} />
                      </>
                    )}
                  </span>
                )}
              </span>
              <Pill status={topicProgress.status} />
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader title="Matérias" subtitle={summary} />
        <Button variant="primary" size="lg" onClick={() => startCreating(filter.areaId === "todas" ? "mat" : filter.areaId, null)}>
          <Plus size={18} aria-hidden />
          Novo tópico
        </Button>
      </div>

      <div className="grid gap-4">
        <div className="flex items-center gap-2">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Buscar tópico</span>
            <Search size={16} aria-hidden className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={filter.query}
              onChange={(event) => updateFilter({ query: event.target.value })}
              placeholder="Buscar tópico"
              className="h-11 w-full rounded-full border-2 border-edge bg-surface pr-4 pl-10 text-[15px] text-text"
            />
          </label>
          <button
            type="button"
            aria-pressed={showFilters}
            aria-label="Mais filtros"
            onClick={() => setShowFilters(!showFilters)}
            className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-edge bg-surface text-text aria-pressed:bg-action aria-pressed:text-on-action"
          >
            <SlidersHorizontal size={18} aria-hidden />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {areaFilters.map((area) => (
            <button
              key={area.id}
              type="button"
              aria-pressed={filter.areaId === area.id}
              onClick={() => updateFilter({ areaId: area.id as AreaId | "todas" })}
              className="h-[34px] rounded-full border-2 border-transparent px-3.5 text-sm whitespace-nowrap text-muted hover:text-text aria-pressed:border-edge aria-pressed:bg-action aria-pressed:font-semibold aria-pressed:text-on-action"
            >
              {area.shortName}
            </button>
          ))}
        </div>

        {showFilters && (
          <div className="grid grid-cols-3 items-end gap-2 text-[13px] text-muted md:flex md:flex-wrap">
            <label className="grid gap-1">
              Status
              <select
                value={filter.status}
                onChange={(event) => updateFilter({ status: event.target.value as TopicStatus | "todos" })}
                className={selectStyles}
              >
                <option value="todos">Todos</option>
                {(Object.keys(STATUS_LABELS) as TopicStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              Prioridade
              <select
                value={filter.priority}
                onChange={(event) => updateFilter({ priority: event.target.value as Priority | "todas" })}
                className={selectStyles}
              >
                <option value="todas">Todas</option>
                {(Object.keys(PRIORITY_LABELS) as Priority[]).map((priority) => (
                  <option key={priority} value={priority}>
                    {PRIORITY_LABELS[priority]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              Ordenar por
              <select value={sort} onChange={(event) => setSort(event.target.value as TopicSort)} className={selectStyles}>
                {(Object.keys(SORT_LABELS) as TopicSort[]).map((key) => (
                  <option key={key} value={key}>
                    {SORT_LABELS[key]}
                  </option>
                ))}
              </select>
            </label>
            {hiddenCount > 0 && (
              <Button onClick={() => setManaging(true)} className="col-span-3 justify-self-start">
                <EyeOff size={16} aria-hidden />
                Ocultos ({hiddenCount})
              </Button>
            )}
            {filtering && (
              <button
                type="button"
                onClick={() => setFilter(EMPTY_FILTER)}
                className="col-span-3 h-9 justify-self-start underline underline-offset-3"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {narrowing && matches.length === 0 && (
        <Card flush>
          <EmptyState title="Nenhum tópico encontrado">
            Tente outro termo ou{" "}
            <button type="button" onClick={() => setFilter(EMPTY_FILTER)} className="underline underline-offset-3">
              limpe os filtros
            </button>
            .
          </EmptyState>
        </Card>
      )}

      {AREAS.filter((area) => filter.areaId === "todas" || area.id === filter.areaId).map((area) => {
        const areaTopics = visible.filter((topic) => topic.areaId === area.id);
        const shown = matches.filter((topic) => topic.areaId === area.id);
        const subjects = subjectsOf(area.id);
        if (narrowing && shown.length === 0) return null;
        const done = areaTopics.filter((topic) => progressOf(progress, topic.id).status === "concluido").length;
        const open = isOpen(area.id);
        const bodyId = `area-${area.id}`;
        const areaSummary = areaTopics.length
          ? [
              plural(areaTopics.length, "tópico", "tópicos"),
              subjects.length ? joinNames(subjects.map((subject) => subject.name)) : plural(done, "concluído", "concluídos"),
            ].join(" · ")
          : "Nenhum tópico ainda";
        return (
          <Card key={area.id} flush>
            <h2>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={bodyId}
                onClick={() => toggleArea(area.id)}
                className="flex w-full items-center gap-4 px-5 py-[18px] text-left md:px-7 md:py-[22px]"
              >
                <span className="grid min-w-0">
                  {area.name}
                  <span className="font-sans text-sm font-normal text-muted">{areaSummary}</span>
                </span>
                <span className="ml-auto flex items-center gap-3.5">
                  {areaTopics.length > 0 && (
                    <ProgressBar thin value={done / areaTopics.length} className="hidden w-[120px] md:block" />
                  )}
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-full border-2 border-edge bg-hover transition-transform ${open ? "rotate-180" : ""}`}
                  >
                    <ChevronDown size={16} aria-hidden />
                  </span>
                </span>
              </button>
            </h2>

            {open && (
              <div id={bodyId} className="px-5 pb-5 md:px-7 md:pb-6">
                {subjects.map((subject) => {
                  const subjectTopics = shown.filter((topic) => topic.subjectId === subject.id);
                  if (narrowing && subjectTopics.length === 0) return null;
                  return (
                    <section key={subject.id} aria-label={subject.name} className="pt-3 [&+&]:mt-2">
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <h3 className="text-xs font-semibold tracking-[0.08em] text-muted uppercase">{subject.name}</h3>
                        <button
                          type="button"
                          onClick={() => startCreating(area.id, subject.id)}
                          aria-label={`Adicionar tópico em ${subject.name}`}
                          className={addStyles}
                        >
                          <Plus size={14} aria-hidden />
                          Adicionar
                        </button>
                      </div>
                      {subjectTopics.length === 0 ? (
                        <p className="py-2 text-sm text-muted">Nenhum tópico ainda.</p>
                      ) : (
                        renderTopics(subjectTopics)
                      )}
                    </section>
                  );
                })}
                {subjects.length > 0 && shown.some((topic) => !topic.subjectId) && (
                  <section aria-label="Sem matéria" className="mt-2 pt-3">
                    <h3 className="mb-1 text-xs font-semibold tracking-[0.08em] text-muted uppercase">
                      Sem matéria · edite para escolher
                    </h3>
                    {renderTopics(shown.filter((topic) => !topic.subjectId))}
                  </section>
                )}
                {subjects.length === 0 && (
                  <>
                    {shown.length === 0 ? (
                      <p className="py-2 text-sm text-muted">Adicione o que você vai estudar, do jeito que preferir.</p>
                    ) : (
                      renderTopics(shown)
                    )}
                    <button type="button" onClick={() => startCreating(area.id, null)} className={`${addStyles} mt-1`}>
                      <Plus size={14} aria-hidden />
                      Adicionar em {area.name}
                    </button>
                  </>
                )}
              </div>
            )}
          </Card>
        );
      })}

      <TopicDrawer key={openTopicId} topic={findTopic(allTopics, openTopicId)} today={today} onClose={closeDrawer} />
      <ManageTopicsDrawer open={managing} onClose={() => setManaging(false)} />
      <Drawer open={creatingIn !== null} onClose={() => setCreatingIn(null)} eyebrow="Matérias" title="Novo tópico">
        {creatingIn && (
          <TopicForm
            initial={{ name: "", ...creatingIn, description: "", priority: "media" }}
            submitLabel="Criar tópico"
            suggest
            onCancel={() => setCreatingIn(null)}
            onSubmit={(input) => {
              const result = addTopic(input);
              if ("error" in result) return result.error;
              setCreatingIn(null);
              showToast("Tópico criado.");
              return null;
            }}
          />
        )}
      </Drawer>
    </div>
  );
}

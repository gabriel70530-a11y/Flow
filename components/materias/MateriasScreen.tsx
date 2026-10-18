"use client";

import { EyeOff, Plus, Search } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Drawer } from "@/components/ui/Drawer";
import { DueLabel } from "@/components/ui/DueLabel";
import { EmptyState } from "@/components/ui/EmptyState";
import { inputStyles } from "@/components/ui/Field";
import { ListRow } from "@/components/ui/ListRow";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { showToast } from "@/components/ui/Toast";
import { toDateKey } from "@/lib/dates";
import { STATUS_LABELS, nextReview, progressOf, type TopicStatus } from "@/lib/reviews";
import { AREAS, type AreaId } from "@/lib/syllabus";
import {
  EMPTY_FILTER,
  PRIORITY_LABELS,
  filterTopics,
  findTopic,
  sortTopics,
  visibleTopics,
  type Priority,
  type TopicFilter,
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

export function MateriasScreen() {
  const hydrated = useHydrated();
  const progress = useStudyStore((state) => state.progress);
  const allTopics = useStudyStore((state) => state.topics);
  const addTopic = useStudyStore((state) => state.addTopic);
  const [filter, setFilter] = useState<TopicFilter>(EMPTY_FILTER);
  const [sort, setSort] = useState<TopicSort>("criacao");
  const [openTopicId, setOpenTopicId] = useState<string | null>(null);
  const [creatingIn, setCreatingIn] = useState<AreaId | null>(null);
  const [managing, setManaging] = useState(false);
  const closeDrawer = useCallback(() => setOpenTopicId(null), []);
  const updateFilter = (changes: Partial<TopicFilter>) => setFilter({ ...filter, ...changes });

  if (!hydrated) {
    return (
      <div className="grid gap-5">
        <PageHeader title="Matérias" subtitle={HINT} />
        <Skeleton className="h-[34px] w-2/3" />
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
  const areaFilters = [{ id: "todas" as const, name: "Todas" }, ...AREAS];
  const summary = visible.length
    ? `${concluded} de ${visible.length} tópicos concluídos${hiddenCount ? ` · ${hiddenCount} ${hiddenCount === 1 ? "oculto" : "ocultos"}` : ""}. ${HINT}`
    : "As cinco áreas do ENEM. Crie os tópicos que você quer estudar em cada uma.";

  return (
    <div className="grid gap-5">
      <PageHeader title="Matérias" subtitle={summary} />

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-[200px] flex-1">
          <span className="sr-only">Buscar tópico</span>
          <Search size={16} aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={filter.query}
            onChange={(event) => updateFilter({ query: event.target.value })}
            placeholder="Buscar tópico"
            className={`${inputStyles} pl-8`}
          />
        </label>
        <Button variant="primary" onClick={() => setCreatingIn(filter.areaId === "todas" ? "mat" : filter.areaId)}>
          <Plus size={16} aria-hidden />
          Novo tópico
        </Button>
        {hiddenCount > 0 && (
          <Button onClick={() => setManaging(true)}>
            <EyeOff size={16} aria-hidden />
            Ocultos ({hiddenCount})
          </Button>
        )}
      </div>

      <div className="flex max-w-full gap-1.5 overflow-x-auto">
        {areaFilters.map((area) => (
          <button
            key={area.id}
            type="button"
            aria-pressed={filter.areaId === area.id}
            onClick={() => updateFilter({ areaId: area.id as AreaId | "todas" })}
            className="h-[34px] rounded-full bg-surface px-3.5 text-sm font-semibold whitespace-nowrap text-muted shadow-card aria-pressed:bg-accent-soft aria-pressed:text-accent aria-pressed:shadow-none"
          >
            {area.name}
          </button>
        ))}
      </div>

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
        if (narrowing && shown.length === 0) return null;
        const done = areaTopics.filter((topic) => progressOf(progress, topic.id).status === "concluido").length;
        return (
          <Card key={area.id} flush>
            <CardHeader flush title={area.name} className="border-b border-line">
              <div className="flex items-center gap-3">
                {areaTopics.length > 0 && (
                  <>
                    <span className="text-[13px] text-muted tabular-nums">
                      {done}/{areaTopics.length}
                      <span className="sr-only"> concluídos</span>
                    </span>
                    <ProgressBar thin value={done / areaTopics.length} className="hidden w-[120px] md:block" />
                  </>
                )}
                <Button onClick={() => setCreatingIn(area.id)} aria-label={`Adicionar tópico em ${area.name}`}>
                  <Plus size={16} aria-hidden />
                  Adicionar
                </Button>
              </div>
            </CardHeader>
            {shown.length === 0 && (
              <p className="px-4 py-4 text-[13px] text-muted md:px-5">
                Nenhum tópico em {area.name} ainda. Adicione o que você vai estudar, do jeito que preferir.
              </p>
            )}
            <ul>
              {shown.map((topic) => {
                const topicProgress = progressOf(progress, topic.id);
                const review = nextReview(topicProgress);
                const details = [
                  topic.priority !== "media" && `Prioridade ${PRIORITY_LABELS[topic.priority].toLowerCase()}`,
                ].filter(Boolean);
                return (
                  <ListRow
                    key={topic.id}
                    onClick={() => setOpenTopicId(topic.id)}
                    title={topic.name}
                    subtitle={
                      (review || details.length > 0) && (
                        <>
                          {details.join(" · ")}
                          {review && details.length > 0 && " · "}
                          {review && (
                            <>
                              Revisão {review.stage}: <DueLabel due={review.due} today={today} />
                            </>
                          )}
                        </>
                      )
                    }
                    end={
                      <>
                        <span className="hidden w-16 text-right text-[13px] text-muted tabular-nums md:inline">
                          {topicProgress.mastery > 0 && `Nível ${topicProgress.mastery}`}
                        </span>
                        <Pill status={topicProgress.status} />
                      </>
                    }
                  />
                );
              })}
            </ul>
          </Card>
        );
      })}

      <TopicDrawer topic={findTopic(allTopics, openTopicId)} today={today} onClose={closeDrawer} />
      <ManageTopicsDrawer open={managing} onClose={() => setManaging(false)} />
      <Drawer open={creatingIn !== null} onClose={() => setCreatingIn(null)} eyebrow="Matérias" title="Novo tópico">
        {creatingIn && (
          <TopicForm
            initial={{ name: "", areaId: creatingIn, description: "", priority: "media" }}
            submitLabel="Criar tópico"
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

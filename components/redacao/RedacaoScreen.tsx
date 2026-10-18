"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { inputStyles } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { showToast } from "@/components/ui/Toast";
import { shortDate, toDateKey } from "@/lib/dates";
import { COMPETENCIES, essayTotal, searchRepertoire, weakestCompetency, type Essay, type RepertoireItem } from "@/lib/essays";
import { useHydrated, useStudyStore } from "@/store/study-store";
import { EssayForm } from "./EssayForm";
import { RepertoireForm } from "./RepertoireForm";

const SUBTITLE =
  "O Flow não corrige redação. Registre a nota que você recebeu (no app MEC Enem, com um professor) e veja o que melhorar.";

function RemoveButton({ onRemove }: { onRemove: () => void }) {
  const [confirming, setConfirming] = useState(false);
  return confirming ? (
    <button type="button" onClick={onRemove} className="text-[13px] font-semibold text-danger">
      Confirmar exclusão
    </button>
  ) : (
    <button type="button" onClick={() => setConfirming(true)} className="text-[13px] text-muted underline underline-offset-3">
      Excluir
    </button>
  );
}

function EssayRow({ essay }: { essay: Essay }) {
  const removeEssay = useStudyStore((state) => state.removeEssay);
  return (
    <li className="grid gap-1.5 border-t border-line px-5 py-4 first:border-t-0 md:px-7">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-medium wrap-anywhere">{essay.theme}</span>
        <span className="shrink-0 font-heading text-[18px] font-bold tabular-nums">
          {essay.scores ? essayTotal(essay.scores) : <span className="font-sans text-[13px] font-normal text-muted">Sem nota</span>}
        </span>
      </div>
      <p className="text-[13px] text-muted tabular-nums">
        {shortDate(essay.date)}
        {essay.corrector && ` · ${essay.corrector}`}
        {essay.scores && ` · ${essay.scores.map((score, index) => `${COMPETENCIES[index].short} ${score}`).join(" ")}`}
      </p>
      {essay.improve && <p className="text-sm wrap-anywhere">Melhorar: {essay.improve}</p>}
      <div>
        <RemoveButton onRemove={() => removeEssay(essay.id)} />
      </div>
    </li>
  );
}

function RepertoireRow({ item }: { item: RepertoireItem }) {
  const removeRepertoire = useStudyStore((state) => state.removeRepertoire);
  return (
    <li className="grid gap-1 border-t border-line px-5 py-3.5 first:border-t-0 md:px-7">
      <span className="font-medium wrap-anywhere">{item.title}</span>
      {item.detail && <span className="text-sm text-muted wrap-anywhere">{item.detail}</span>}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        {item.themes ? <span className="text-[13px] text-muted">Serve para: {item.themes}</span> : <span />}
        <RemoveButton onRemove={() => removeRepertoire(item.id)} />
      </div>
    </li>
  );
}

export function RedacaoScreen() {
  const hydrated = useHydrated();
  const essays = useStudyStore((state) => state.essays);
  const repertoire = useStudyStore((state) => state.repertoire);
  const [drawer, setDrawer] = useState<"redacao" | "repertorio" | null>(null);
  const [query, setQuery] = useState("");

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <PageHeader title="Redação" subtitle={SUBTITLE} />
      {hydrated && (
        <Button variant="primary" size="lg" onClick={() => setDrawer("redacao")}>
          <Plus size={18} aria-hidden />
          Registrar redação
        </Button>
      )}
    </div>
  );

  if (!hydrated) {
    return (
      <div className="grid gap-6">
        {header}
        <Skeleton className="h-64" />
      </div>
    );
  }

  const today = toDateKey(new Date());
  const sorted = [...essays].sort((first, second) => second.date.localeCompare(first.date));
  const corrected = sorted.filter((essay) => essay.scores !== null);
  const weakest = weakestCompetency(essays);
  const found = searchRepertoire(repertoire, query);
  const close = (message: string) => {
    setDrawer(null);
    showToast(message);
  };

  return (
    <div className="grid gap-6">
      {header}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="grid gap-6">
          {corrected.length > 0 && (
            <Card>
              <CardHeader title="Evolução" />
              <p className="font-heading text-[44px] leading-none font-extrabold tabular-nums font-stretch-115%">
                {essayTotal(corrected[0].scores ?? [])}
                <small className="ml-2 font-sans text-base font-medium text-muted">na última corrigida</small>
              </p>
              {corrected.length > 1 && (
                <p className="mt-3 text-sm text-muted tabular-nums">
                  Antes: {corrected.slice(1, 5).map((essay) => essayTotal(essay.scores ?? [])).join(" · ")}
                </p>
              )}
              {weakest && (
                <p className="mt-4 rounded-[12px] bg-hover px-3.5 py-3 text-sm">
                  Ponto a treinar: <strong>{COMPETENCIES[weakest.index].short} {COMPETENCIES[weakest.index].name}</strong>, com média{" "}
                  <span className="tabular-nums">{Math.round(weakest.average)}</span> nas últimas redações.
                </p>
              )}
            </Card>
          )}

          <Card flush>
            <CardHeader flush title="Suas redações">
              <span className="text-[13px] text-muted tabular-nums">{essays.length}</span>
            </CardHeader>
            {sorted.length > 0 ? (
              <ul className="pb-2">
                {sorted.map((essay) => (
                  <EssayRow key={essay.id} essay={essay} />
                ))}
              </ul>
            ) : (
              <EmptyState title="Nenhuma redação registrada">
                Escreva uma por semana, à mão e no tempo da prova (cerca de 1h). Depois de corrigir, registre aqui as notas por
                competência.
              </EmptyState>
            )}
          </Card>
        </div>

        <Card flush>
          <CardHeader flush title="Repertório">
            <Button onClick={() => setDrawer("repertorio")}>
              <Plus size={16} aria-hidden />
              Adicionar
            </Button>
          </CardHeader>
          <p className="px-5 pb-3 text-[13px] text-muted md:px-7">
            Guarde o que você já sabe usar: obras, leis, dados. Na hora de escrever, busque pelo tema.
          </p>
          {repertoire.length > 0 && (
            <div className="px-5 pb-3 md:px-7">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por tema ou palavra"
                aria-label="Buscar no repertório"
                className={`${inputStyles} rounded-full px-4`}
              />
            </div>
          )}
          {found.length > 0 ? (
            <ul className="pb-2">
              {found.map((item) => (
                <RepertoireRow key={item.id} item={item} />
              ))}
            </ul>
          ) : (
            <p className="px-5 pb-5 text-[13px] text-muted md:px-7">
              {repertoire.length ? "Nada encontrado para essa busca." : "Nenhum repertório ainda."}
            </p>
          )}
        </Card>
      </div>

      <Drawer open={drawer === "redacao"} onClose={() => setDrawer(null)} eyebrow="Redação" title="Registrar redação">
        {drawer === "redacao" && <EssayForm today={today} onDone={() => close("Redação registrada.")} />}
      </Drawer>
      <Drawer open={drawer === "repertorio"} onClose={() => setDrawer(null)} eyebrow="Redação" title="Novo repertório">
        {drawer === "repertorio" && <RepertoireForm onDone={() => close("Repertório salvo.")} />}
      </Drawer>
    </div>
  );
}

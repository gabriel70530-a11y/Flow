"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, inputStyles } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { showToast } from "@/components/ui/Toast";
import { AreaChips, AvailabilityFields, SessionLengthField, strategyOptions } from "@/components/cronograma/planner-fields";
import { shortDate, toDateKey } from "@/lib/dates";
import type { PlannerSettings } from "@/lib/planner";
import { formatDuration } from "@/lib/stats";
import { findArea, type AreaId } from "@/lib/syllabus";
import type { OnboardingState } from "@/store/state";
import { useHydrated, useStudyStore } from "@/store/study-store";

const STEPS = ["Objetivo", "Tempo", "Áreas", "Prova", "Organização", "Resumo"];
const COURSE_MAX = 80;

const planModeOptions: { value: OnboardingState["planMode"]; label: string }[] = [
  { value: "sugerido", label: "Plano sugerido" },
  { value: "manual", label: "Organizar sozinho" },
];

function areaNames(areas: AreaId[]): string {
  return areas.length ? areas.map((areaId) => findArea(areaId).name).join(", ") : "Nenhuma";
}

export function OnboardingFlow() {
  const hydrated = useHydrated();
  if (!hydrated) {
    return (
      <div className="grid gap-5">
        <PageHeader title="Montar meu plano" subtitle="Leva uns 2 minutos. Dá para pular e mudar tudo depois." />
        <Skeleton className="h-96" />
      </div>
    );
  }
  return <OnboardingSteps />;
}

function OnboardingSteps() {
  const router = useRouter();
  const stored = useStudyStore((state) => state.planner);
  const storedMode = useStudyStore((state) => state.onboarding.planMode);
  const { finishOnboarding, skipOnboarding } = useStudyStore.getState();
  const [step, setStep] = useState(0);
  const [settings, setSettings] = useState<PlannerSettings>(stored);
  const [planMode, setPlanMode] = useState(storedMode);
  const [error, setError] = useState<string | null>(null);
  const today = toDateKey(new Date());
  const weekMinutes = settings.availability.reduce((sum, minutes) => sum + minutes, 0);

  const update = (changes: Partial<PlannerSettings>) => {
    setSettings((current) => ({ ...current, ...changes }));
    setError(null);
  };

  const goTo = (target: number) => {
    if (step === 1 && target > 1 && weekMinutes === 0) {
      setError("Escolha pelo menos um dia com tempo para estudar.");
      return;
    }
    setError(null);
    setStep(target);
  };

  const skip = () => {
    skipOnboarding();
    showToast("Tudo bem. Você pode montar o plano depois pelo Cronograma.");
    router.push("/painel");
  };

  const finish = () => {
    const result = finishOnboarding(settings, planMode);
    if (result) {
      setError(result);
      return;
    }
    showToast(planMode === "sugerido" ? "Plano criado. Ajuste o que quiser." : "Preferências salvas.");
    router.push(planMode === "sugerido" ? "/cronograma" : "/painel");
  };

  const summary: [string, string, number][] = [
    ["Objetivo", settings.course || "Não informado", 0],
    ["Tempo por semana", `${formatDuration(weekMinutes * 60)} em sessões de ${settings.sessionMinutes} min`, 1],
    ["Áreas prioritárias ou difíceis", areaNames(settings.difficultAreas), 2],
    ["Áreas em que vai bem", areaNames(settings.strongAreas), 2],
    ["Data da prova", settings.targetDate ? shortDate(settings.targetDate) + "/" + settings.targetDate.slice(0, 4) : "Não informada", 3],
    [
      "Organização",
      planMode === "sugerido"
        ? `Plano sugerido, ${settings.strategy === "equilibrada" ? "equilibrado entre as áreas" : "com foco nas prioridades"}`
        : "Organizar sozinho",
      4,
    ],
  ];

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader title="Montar meu plano" subtitle="Leva uns 2 minutos. Dá para pular e mudar tudo depois." />
        <button type="button" onClick={skip} className="min-h-9 text-sm text-muted underline underline-offset-3">
          Pular por agora
        </button>
      </div>

      <Card className="grid max-w-2xl gap-5">
        <div className="grid gap-2">
          <span className="text-[13px] text-muted tabular-nums">
            Passo {step + 1} de {STEPS.length} · {STEPS[step]}
          </span>
          <ProgressBar thin value={(step + 1) / STEPS.length} />
        </div>

        {step === 0 && (
          <Field label="Qual curso ou área você quer? (opcional)" hint="Só para lembrar o seu objetivo. Não muda o cálculo do plano.">
            <input
              value={settings.course}
              maxLength={COURSE_MAX}
              onChange={(event) => update({ course: event.target.value })}
              placeholder="Ex.: Enfermagem, Engenharia, ainda não sei"
              className={inputStyles}
            />
          </Field>
        )}

        {step === 1 && (
          <div className="grid gap-5">
            <div className="grid gap-1.5">
              <span className="text-[13px] font-semibold text-muted">Quanto tempo você tem para estudar em cada dia?</span>
              <AvailabilityFields value={settings.availability} onChange={(availability) => update({ availability })} />
            </div>
            <SessionLengthField value={settings.sessionMinutes} onChange={(sessionMinutes) => update({ sessionMinutes })} />
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-5">
            <AreaChips
              label="Quais áreas estão mais difíceis ou são prioridade?"
              hint="Elas recebem mais sessões no plano."
              value={settings.difficultAreas}
              onChange={(difficultAreas) => update({ difficultAreas })}
            />
            <AreaChips
              label="Em quais você já vai bem?"
              value={settings.strongAreas}
              onChange={(strongAreas) => update({ strongAreas })}
            />
          </div>
        )}

        {step === 3 && (
          <Field label="Quando é a sua prova? (opcional)" hint="Se ainda não sabe, deixe em branco. Você pode informar depois.">
            <input
              type="date"
              min={today}
              value={settings.targetDate ?? ""}
              onChange={(event) => update({ targetDate: event.target.value || null })}
              className={inputStyles}
            />
          </Field>
        )}

        {step === 4 && (
          <div className="grid gap-5">
            <div className="grid gap-1.5">
              <span className="text-[13px] font-semibold text-muted">Como você prefere organizar a semana?</span>
              <Segmented options={planModeOptions} value={planMode} onChange={setPlanMode} />
              <p className="text-[13px] text-muted">
                {planMode === "sugerido"
                  ? "O ENEM Flow sugere tarefas que cabem no seu tempo. Você pode mover, dividir ou remover qualquer uma."
                  : "Você adiciona as tarefas no Cronograma quando quiser. Timer, revisões e painel funcionam do mesmo jeito."}
              </p>
            </div>
            {planMode === "sugerido" && (
              <div className="grid gap-1.5">
                <span className="text-[13px] font-semibold text-muted">Como distribuir</span>
                <Segmented options={strategyOptions} value={settings.strategy} onChange={(strategy) => update({ strategy })} />
              </div>
            )}
          </div>
        )}

        {step === 5 && (
          <dl className="grid gap-3">
            {summary.map(([label, value, target]) => (
              <div key={label} className="flex items-start justify-between gap-3 border-b border-line pb-3 last:border-b-0">
                <div className="min-w-0">
                  <dt className="text-[13px] text-muted">{label}</dt>
                  <dd className="wrap-anywhere">{value}</dd>
                </div>
                <Button onClick={() => setStep(target)} aria-label={`Editar ${label.toLowerCase()}`}>
                  Editar
                </Button>
              </div>
            ))}
          </dl>
        )}

        {error && (
          <p role="alert" className="text-[13px] text-danger">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {step > 0 && (
            <Button size="lg" onClick={() => goTo(step - 1)}>
              Voltar
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button variant="primary" size="lg" className="flex-1" onClick={() => goTo(step + 1)}>
              Continuar
            </Button>
          ) : (
            <Button variant="primary" size="lg" className="flex-1" onClick={finish}>
              {planMode === "sugerido" ? "Gerar meu plano" : "Salvar e organizar sozinho"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

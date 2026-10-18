"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { Button, buttonStyles, linkStyles } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, inputStyles } from "@/components/ui/Field";
import { NumberInput } from "@/components/ui/NumberInput";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { showToast } from "@/components/ui/Toast";
import { PlannerSettingsForm } from "@/components/cronograma/planner-fields";
import { THEME_OPTIONS } from "@/components/shell/ThemeSelect";
import { toDateKey } from "@/lib/dates";
import { GOAL_LIMITS, GOAL_UNITS, type GoalType } from "@/lib/stats";
import { analyticsUrl } from "@/store/analytics";
import { useHydrated, useStudyStore, type Theme } from "@/store/study-store";

const SUBTITLE = "Preferências, metas e os seus dados.";

function Toggle({ pressed, onChange, children }: { pressed: boolean; onChange: (value: boolean) => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onChange(!pressed)}
      className="flex min-h-11 w-full items-center justify-between gap-3 text-left"
    >
      <span>{children}</span>
      <span className="shrink-0 rounded-full bg-hover px-3 py-1 text-[13px] font-semibold text-muted">
        {pressed ? "Ligado" : "Desligado"}
      </span>
    </button>
  );
}

export function AjustesScreen() {
  const hydrated = useHydrated();
  if (!hydrated) {
    return (
      <div className="grid gap-6">
        <PageHeader title="Ajustes" subtitle={SUBTITLE} />
        <Skeleton className="h-96" />
      </div>
    );
  }
  return <Settings />;
}

function Settings() {
  const router = useRouter();
  const theme = useStudyStore((state) => state.theme);
  const sound = useStudyStore((state) => state.sound);
  const showStreak = useStudyStore((state) => state.showStreak);
  const analyticsConsent = useStudyStore((state) => state.analyticsConsent);
  const goal = useStudyStore((state) => state.goal);
  const planner = useStudyStore((state) => state.planner);
  const { setTheme, setSound, setShowStreak, setAnalyticsConsent, setGoal, savePlanner, exportBackup, importBackup, resetData } =
    useStudyStore.getState();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const today = toDateKey(new Date());

  const download = () => {
    const url = URL.createObjectURL(new Blob([exportBackup()], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `enem-flow-${today}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Backup baixado.");
  };

  const chooseFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setImportError(null);
    if (!file) return;
    if (file.size > 5_000_000) {
      setImportError("Arquivo grande demais para um backup do Flow.");
      return;
    }
    setPendingImport(await file.text());
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    const error = importBackup(pendingImport);
    setPendingImport(null);
    if (error) setImportError(error);
    else showToast("Dados importados.");
  };

  const reset = () => {
    if (!confirmingReset) {
      setConfirmingReset(true);
      return;
    }
    setConfirmingReset(false);
    resetData();
    showToast("Dados apagados.");
    router.push("/painel");
  };

  return (
    <div className="grid gap-6">
      <PageHeader title="Ajustes" subtitle={SUBTITLE} />

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <div className="grid gap-6">
          <Card>
            <CardHeader title="Preferências" />
            <div className="grid gap-2">
              <Field label="Aparência">
                <select value={theme} onChange={(event) => setTheme(event.target.value as Theme)} className={inputStyles}>
                  {THEME_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Toggle pressed={sound} onChange={setSound}>
                Aviso sonoro ao fim de cada bloco do Pomodoro
              </Toggle>
              <Toggle pressed={showStreak} onChange={setShowStreak}>
                Mostrar sequência de dias no painel
              </Toggle>
              {analyticsUrl() && (
                <>
                  <Toggle pressed={analyticsConsent} onChange={setAnalyticsConsent}>
                    Compartilhar dados de uso anônimos
                  </Toggle>
                  <p className="text-[13px] text-muted">
                    Só eventos como &quot;sessão registrada&quot; e o dia, com um código aleatório deste navegador. Nada de nome,
                    tópicos ou anotações. Ajuda a melhorar o app durante o teste.
                  </p>
                </>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Meta semanal" />
            <div className="flex flex-wrap items-end gap-2">
              <Field label="Quantidade">
                <NumberInput
                  value={goal.value}
                  min={1}
                  max={GOAL_LIMITS[goal.type].max}
                  onCommit={(value) => setGoal({ type: goal.type, value })}
                  className="w-24"
                />
              </Field>
              <Field label="Medida" className="flex-1">
                <select
                  value={goal.type}
                  onChange={(event) => {
                    const type = event.target.value as GoalType;
                    setGoal({ type, value: GOAL_LIMITS[type].fallback });
                  }}
                  className={inputStyles}
                >
                  {(Object.keys(GOAL_UNITS) as GoalType[]).map((type) => (
                    <option key={type} value={type}>
                      {GOAL_UNITS[type].label} por semana
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <p className="mt-3 text-[13px] text-muted">
              Mudar a meta não altera o que você já registrou. Ajuste quando a rotina mudar.
            </p>
          </Card>

          <Card>
            <CardHeader title="Seus dados" />
            <div className="grid gap-4 text-sm">
              <p className="text-muted">
                Tudo fica salvo só neste navegador. Não há conta nem sincronização entre aparelhos: para levar seus dados, baixe um
                backup e importe no outro navegador.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={download}>Baixar backup</Button>
                <Button onClick={() => fileInput.current?.click()}>Importar backup</Button>
                <input ref={fileInput} type="file" accept="application/json,.json" onChange={chooseFile} className="sr-only" tabIndex={-1} aria-hidden />
              </div>
              {pendingImport && (
                <div className="grid gap-2 rounded-[12px] bg-accent-soft p-3.5">
                  <p>Importar substitui todos os dados atuais deste navegador pelos do arquivo. Quer continuar?</p>
                  <div className="flex gap-2">
                    <Button variant="primary" onClick={confirmImport}>
                      Substituir dados
                    </Button>
                    <Button onClick={() => setPendingImport(null)}>Cancelar</Button>
                  </div>
                </div>
              )}
              {importError && (
                <p role="alert" className="text-danger">
                  {importError}
                </p>
              )}
              <div className="grid gap-1 border-t border-line pt-4">
                <Button onClick={reset} className="justify-self-start">
                  {confirmingReset ? "Clique de novo para apagar tudo" : "Apagar todos os dados"}
                </Button>
                <p className="text-[13px] text-muted">
                  Apaga tópicos editados, sessões, revisões e cronograma. Aparência e preferências ficam. Baixe um backup antes, se
                  quiser guardar.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader title="Cronograma">
              <Link href="/comecar" className={`${linkStyles} shrink-0`}>
                Refazer configuração
              </Link>
            </CardHeader>
            <PlannerSettingsForm
              initial={planner}
              submitLabel="Salvar preferências"
              onSubmit={(settings) => {
                const error = savePlanner(settings);
                if (!error) showToast("Preferências salvas. Atualize o plano no Cronograma para aplicar.");
                return error;
              }}
            />
          </Card>

          <Card>
            <CardHeader title="Sobre" />
            <div className="grid gap-3 text-sm text-muted">
              <p>
                O Flow ajuda a organizar os estudos para o ENEM. Não é cursinho, não promete nota nem aprovação e não tem vínculo com o INEP
                ou o MEC.
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                <Link href="/planos" className={buttonStyles()}>
                  Planos
                </Link>
                <Link href="/privacidade" className={linkStyles}>
                  Privacidade
                </Link>
                <Link href="/termos" className={linkStyles}>
                  Termos de uso
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

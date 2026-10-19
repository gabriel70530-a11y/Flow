"use client";

import { useState } from "react";
import { Button, linkStyles } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Drawer } from "@/components/ui/Drawer";
import { ESSAY_AXES, ESSAY_THEMES, recommendThemes, themeWritten, type EssayAxis, type EssayTheme } from "@/lib/essay-themes";
import { useStudyStore } from "@/store/study-store";

const WEEK_MS = 7 * 24 * 3600 * 1000;

function axisLabel(axis: EssayAxis): string {
  return ESSAY_AXES.find((item) => item.value === axis)?.label ?? "";
}

function ThemeButton({ theme, written, onOpen }: { theme: EssayTheme; written: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="grid w-full content-start gap-2 rounded-[14px] border-2 border-line bg-surface p-3.5 text-left hover:border-edge"
    >
      <span className="font-semibold leading-snug">{theme.title}</span>
      <span className="flex flex-wrap gap-1.5 text-xs font-semibold">
        <span className="rounded-full bg-hover px-2.5 py-0.5 text-accent">{theme.year ? `Enem ${theme.year}` : "Treino"}</span>
        <span className="rounded-full bg-hover px-2.5 py-0.5 text-muted">{axisLabel(theme.axis)}</span>
        {written && <span className="rounded-full bg-hover px-2.5 py-0.5 text-success">Já escrito</span>}
      </span>
    </button>
  );
}

export function ThemesCard({ onWrite }: { onWrite: (theme: string) => void }) {
  const essays = useStudyStore((state) => state.essays);
  const [listing, setListing] = useState(false);
  const [axis, setAxis] = useState<EssayAxis | null>(null);
  const [open, setOpen] = useState<EssayTheme | null>(null);
  const [week] = useState(() => Math.floor(Date.now() / WEEK_MS));
  const recommended = recommendThemes(ESSAY_THEMES, essays, week);
  const listed = ESSAY_THEMES.filter((theme) => !axis || theme.axis === axis);

  const write = () => {
    if (!open) return;
    onWrite(open.title);
    setOpen(null);
    setListing(false);
  };

  return (
    <Card>
      <CardHeader title="Temas para treinar">
        <button type="button" onClick={() => setListing(true)} className={`${linkStyles} shrink-0 whitespace-nowrap`}>
          Ver todos
        </button>
      </CardHeader>
      <ul className="grid gap-2.5">
        {recommended.map((theme) => (
          <li key={theme.id}>
            <ThemeButton theme={theme} written={false} onOpen={() => setOpen(theme)} />
          </li>
        ))}
      </ul>

      <Drawer open={listing && !open} onClose={() => setListing(false)} eyebrow="Redação" title="Temas">
        <div className="grid gap-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Eixos">
            {[{ value: null, label: "Todos" }, ...ESSAY_AXES].map((item) => (
              <button
                key={item.label}
                type="button"
                aria-pressed={axis === item.value}
                onClick={() => setAxis(item.value)}
                className="min-h-[34px] rounded-full border-2 border-transparent bg-hover px-3.5 text-sm font-semibold text-text hover:border-edge aria-pressed:border-edge aria-pressed:bg-action aria-pressed:text-on-action"
              >
                {item.label}
              </button>
            ))}
          </div>
          <ul className="grid gap-2.5">
            {listed.map((theme) => (
              <li key={theme.id}>
                <ThemeButton theme={theme} written={themeWritten(theme, essays)} onOpen={() => setOpen(theme)} />
              </li>
            ))}
          </ul>
        </div>
      </Drawer>

      <Drawer
        open={open !== null}
        onClose={() => setOpen(null)}
        eyebrow={open ? (open.year ? `Enem ${open.year} · ${axisLabel(open.axis)}` : `Treino · ${axisLabel(open.axis)}`) : ""}
        title={open?.title ?? ""}
      >
        {open && (
          <div className="grid gap-5">
            <ul className="grid gap-2">
              {open.points.map((point) => (
                <li key={point} className="rounded-[12px] bg-hover px-3.5 py-2.5 text-sm">
                  {point}
                </li>
              ))}
            </ul>
            <div>
              <Button variant="primary" onClick={write}>
                Registrar redação
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </Card>
  );
}

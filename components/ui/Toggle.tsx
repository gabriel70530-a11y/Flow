import type { ReactNode } from "react";

export function Toggle({ pressed, onChange, children }: { pressed: boolean; onChange: (value: boolean) => void; children: ReactNode }) {
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

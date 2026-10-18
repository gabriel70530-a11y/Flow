"use client";

import type { Theme } from "@/store/study-store";

export const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "system", label: "Automática" },
  { value: "light", label: "Clara" },
  { value: "dark", label: "Escura" },
];

interface ThemeSelectProps {
  theme: Theme;
  onChange: (theme: Theme) => void;
}

export function ThemeSelect({ theme, onChange }: ThemeSelectProps) {
  return (
    <label className="grid gap-1.5 px-3 text-[13px] text-muted">
      Aparência
      <select
        value={theme}
        onChange={(event) => onChange(event.target.value as Theme)}
        className="h-10 rounded-[10px] border-2 border-line bg-surface px-3 text-[15px] text-text"
      >
        {THEME_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

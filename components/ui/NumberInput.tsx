"use client";

import { useState, type KeyboardEvent } from "react";

interface NumberInputProps {
  value: number;
  min: number;
  max: number;
  onCommit: (value: number) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

// Só grava ao sair do campo ou apertar Enter, para não corrigir o número no meio da digitação.
export function NumberInput({ value, min, max, onCommit, disabled, className = "", ...props }: NumberInputProps) {
  const [resetKey, setResetKey] = useState(0);

  const commit = (input: HTMLInputElement) => {
    onCommit(input.valueAsNumber);
    setResetKey((key) => key + 1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") commit(event.currentTarget);
  };

  return (
    <input
      key={`${resetKey}-${value}`}
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      defaultValue={value}
      disabled={disabled}
      onBlur={(event) => commit(event.currentTarget)}
      onKeyDown={handleKeyDown}
      className={`h-9 rounded-lg border border-line bg-surface px-2.5 text-text tabular-nums ${className}`}
      {...props}
    />
  );
}

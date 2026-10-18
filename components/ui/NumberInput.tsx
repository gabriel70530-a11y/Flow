"use client";

import { useState, type KeyboardEvent } from "react";

interface NumberInputProps {
  value: number;
  min: number;
  max: number;
  onCommit: (value: number) => void;
  disabled?: boolean;
  // Versão pequena, em pílula, para usar no meio de uma frase.
  compact?: boolean;
  className?: string;
  "aria-label"?: string;
}

// Só grava ao sair do campo ou apertar Enter, para não corrigir o número no meio da digitação.
export function NumberInput({ value, min, max, onCommit, disabled, compact = false, className = "", ...props }: NumberInputProps) {
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
      className={`${compact ? "h-8 rounded-full px-2.5 text-center" : "h-10 rounded-[10px] px-3"} border-2 border-line bg-surface text-text tabular-nums focus:border-edge ${className}`}
      {...props}
    />
  );
}

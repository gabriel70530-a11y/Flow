import type { ReactNode } from "react";

export interface SegmentedOption<Value> {
  value: Value;
  label: ReactNode;
  ariaLabel?: string;
}

interface SegmentedProps<Value> {
  options: SegmentedOption<Value>[];
  value: Value | null;
  onChange: (value: Value) => void;
  disabled?: boolean;
  wrap?: boolean;
  className?: string;
}

export function Segmented<Value extends string | number>({
  options,
  value,
  onChange,
  disabled = false,
  wrap = false,
  className = "",
}: SegmentedProps<Value>) {
  return (
    <div className={`${wrap ? "grid grid-cols-2 gap-[3px]" : "flex"} rounded-[20px] bg-hover p-[3px] ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          aria-label={option.ariaLabel}
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className="h-8 flex-1 rounded-full px-3 text-sm font-semibold whitespace-nowrap text-muted tabular-nums aria-pressed:bg-action aria-pressed:text-on-action"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

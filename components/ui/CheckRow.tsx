import { Check } from "lucide-react";
import type { ReactNode } from "react";

interface CheckRowProps {
  checked: boolean;
  onToggle: () => void;
  label: ReactNode;
  hint?: ReactNode;
  // Riscar o texto quando marcado (checklist de tarefas feitas); numa seleção, o texto fica igual.
  strike?: boolean;
}

export function CheckRow({ checked, onToggle, label, hint, strike = false }: CheckRowProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className="-mx-2 flex w-[calc(100%+16px)] items-start gap-3 rounded-[12px] px-2 py-2.5 text-left hover:bg-hover"
    >
      <span
        aria-hidden
        className={`mt-0.5 grid size-[22px] shrink-0 place-items-center rounded-[7px] border-2 border-edge ${
          checked ? "bg-action text-on-action" : "bg-surface"
        }`}
      >
        {checked && <Check size={14} strokeWidth={3} />}
      </span>
      <span className="grid gap-0.5">
        <span className={checked && strike ? "text-muted line-through" : "font-medium"}>{label}</span>
        {hint && <span className="text-[13px] text-muted">{hint}</span>}
      </span>
    </button>
  );
}

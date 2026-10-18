import type { ReactNode } from "react";

export const inputStyles =
  "h-10 w-full rounded-[10px] border-2 border-line bg-surface px-3 text-[15px] font-normal text-text focus:border-edge disabled:opacity-45";

interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  className?: string;
  children: ReactNode;
}

export function Field({ label, hint, error, className = "", children }: FieldProps) {
  return (
    <label className={`grid gap-1.5 text-[13px] font-semibold text-muted ${className}`}>
      {label}
      {children}
      {hint && <span className="font-normal">{hint}</span>}
      {error && (
        <span role="alert" className="font-normal text-danger">
          {error}
        </span>
      )}
    </label>
  );
}

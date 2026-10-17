import type { ReactNode } from "react";

export const inputStyles =
  "h-9 w-full rounded-lg border border-line bg-surface px-2.5 text-[15px] font-normal text-text disabled:opacity-45";

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

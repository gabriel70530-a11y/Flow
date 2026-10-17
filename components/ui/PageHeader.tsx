import type { ReactNode } from "react";

export function PageHeader({ title, subtitle }: { title: string; subtitle: ReactNode }) {
  return (
    <div>
      <h1>{title}</h1>
      <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>
    </div>
  );
}

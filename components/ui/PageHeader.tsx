import type { ReactNode } from "react";

export function PageHeader({ title, subtitle }: { title: string; subtitle: ReactNode }) {
  return (
    <div>
      <h1>{title}</h1>
      <p className="mt-1.5 text-[15px] text-muted">{subtitle}</p>
    </div>
  );
}

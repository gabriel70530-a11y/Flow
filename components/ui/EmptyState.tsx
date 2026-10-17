import type { ReactNode } from "react";

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="px-5 py-8 text-center text-muted">
      <strong className="mb-1 block text-base text-text">{title}</strong>
      {children}
    </div>
  );
}

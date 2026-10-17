import type { ReactNode } from "react";

interface CardProps {
  flush?: boolean;
  className?: string;
  children: ReactNode;
}

export function Card({ flush = false, className = "", children }: CardProps) {
  return (
    <section
      className={`rounded-xl bg-surface shadow-card ${flush ? "overflow-hidden" : "p-4 md:p-5"} ${className}`}
    >
      {children}
    </section>
  );
}

interface CardHeaderProps {
  title: ReactNode;
  flush?: boolean;
  className?: string;
  children?: ReactNode;
}

export function CardHeader({ title, flush = false, className = "", children }: CardHeaderProps) {
  return (
    <div
      className={`flex items-center justify-between gap-3 ${flush ? "mb-2 px-4 pt-3.5 md:px-5 md:pt-4" : "mb-4"} ${className}`}
    >
      <h2>{title}</h2>
      {children}
    </div>
  );
}

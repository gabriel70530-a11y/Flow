import type { ReactNode } from "react";

interface CardProps {
  flush?: boolean;
  className?: string;
  children: ReactNode;
}

export function Card({ flush = false, className = "", children }: CardProps) {
  return (
    <section
      className={`rounded-[18px] border-2 border-edge bg-surface shadow-card ${flush ? "overflow-hidden" : "p-5 md:p-7"} ${className}`}
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
      className={`flex items-center justify-between gap-3 ${flush ? "mb-2 px-5 pt-5 md:px-7 md:pt-6" : "mb-4"} ${className}`}
    >
      <h2>{title}</h2>
      {children}
    </div>
  );
}

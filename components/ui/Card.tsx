import type { ReactNode } from "react";

interface CardProps {
  flush?: boolean;
  className?: string;
  children: ReactNode;
}

export function Card({ flush = false, className = "", children }: CardProps) {
  return (
    <section
      className={`rounded-[16px] border border-line bg-surface md:rounded-[18px] ${flush ? "overflow-hidden" : "p-[18px] md:p-6"} ${className}`}
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
      className={`flex items-center justify-between gap-3 ${flush ? "mb-2 px-[18px] pt-[18px] md:px-6 md:pt-5" : "mb-3.5"} ${className}`}
    >
      <h2>{title}</h2>
      {children}
    </div>
  );
}

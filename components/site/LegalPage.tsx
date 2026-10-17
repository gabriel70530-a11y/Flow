import type { ReactNode } from "react";

interface LegalPageProps {
  title: string;
  children: ReactNode;
}

export function LegalPage({ title, children }: LegalPageProps) {
  return (
    <article className="mx-auto grid max-w-3xl gap-6 px-4 py-12 md:px-8">
      <header className="grid gap-2">
        <h1>{title}</h1>
        <p className="text-[13px] text-muted">
          Versão preliminar para o período de teste, de outubro de 2026. Será revisada antes da abertura ao público.
        </p>
      </header>
      <div className="grid gap-6 text-[15px] [&_h2]:mb-2 [&_li]:ml-5 [&_li]:list-disc [&_p]:text-muted [&_ul]:grid [&_ul]:gap-1 [&_ul]:text-muted">
        {children}
      </div>
    </article>
  );
}

"use client";

import Link from "next/link";
import { PREP_ITEMS } from "@/components/shell/nav-items";

// No celular a Preparação não cabe nas abas: fica logo depois de "Estudar hoje", em atalhos. No computador, está no menu lateral.
export function PrepShortcuts() {
  return (
    <section aria-labelledby="preparacao-atalhos" className="grid gap-2.5 md:hidden">
      <div className="flex items-baseline justify-between">
        <h2 id="preparacao-atalhos">Preparação</h2>
        <Link href="/preparacao" className="text-sm font-semibold text-accent">
          Ver tudo
        </Link>
      </div>
      <ul className="grid grid-cols-3 gap-2">
        {PREP_ITEMS.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="grid h-full justify-items-center gap-1.5 rounded-[14px] border border-line bg-surface px-1 py-3 text-center text-[13px] font-semibold hover:bg-hover"
            >
              <Icon size={20} className="text-accent" aria-hidden />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

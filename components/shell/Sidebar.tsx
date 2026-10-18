import { Settings } from "lucide-react";
import Link from "next/link";
import type { Theme } from "@/store/study-store";
import { NAV_ITEMS, PREP_ITEMS } from "./nav-items";
import { ThemeSelect } from "./ThemeSelect";
import { Wordmark } from "./Wordmark";

interface SidebarProps {
  pathname: string;
  dueReviews: number;
  timerText: string | null;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export function Sidebar({ pathname, dueReviews, timerText, theme, onThemeChange }: SidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col gap-1 overflow-y-auto bg-bg pt-[calc(28px+env(safe-area-inset-top,0px))] pr-4 pb-[calc(20px+env(safe-area-inset-bottom,0px))] pl-[max(16px,env(safe-area-inset-left,0px))] md:flex">
      <div className="self-start px-2 pb-7">
        <Wordmark />
      </div>
      <nav className="contents">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname.startsWith(href) ? "page" : undefined}
            className="flex items-center gap-3 rounded-[12px] border-2 border-transparent px-3 py-2.5 font-medium text-muted hover:text-text aria-[current=page]:border-edge aria-[current=page]:bg-surface aria-[current=page]:font-semibold aria-[current=page]:text-text aria-[current=page]:shadow-stamp"
          >
            <Icon size={20} strokeWidth={2} aria-hidden />
            {label}
            {href === "/timer" && timerText && (
              <span className="ml-auto text-[13px] font-normal text-muted tabular-nums">{timerText}</span>
            )}
            {href === "/revisoes" && dueReviews > 0 && (
              <span className="ml-auto rounded-full bg-danger px-[7px] py-px text-xs font-bold text-white tabular-nums">
                {dueReviews}
              </span>
            )}
          </Link>
        ))}
      </nav>
      <nav aria-label="Preparação" className="mt-6 grid gap-0.5">
        <span className="px-3 pb-1 text-xs font-semibold tracking-[0.08em] text-muted uppercase">Preparação</span>
        {PREP_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname.startsWith(href) ? "page" : undefined}
            className="flex items-center gap-3 rounded-[12px] border-2 border-transparent px-3 py-2 text-sm font-medium text-muted hover:text-text aria-[current=page]:border-edge aria-[current=page]:bg-surface aria-[current=page]:font-semibold aria-[current=page]:text-text aria-[current=page]:shadow-stamp"
          >
            <Icon size={18} strokeWidth={2} aria-hidden />
            {label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto grid gap-3">
        <Link
          href="/ajustes"
          aria-current={pathname.startsWith("/ajustes") ? "page" : undefined}
          className="flex items-center gap-3 rounded-[12px] border-2 border-transparent px-3 py-2.5 font-medium text-muted hover:text-text aria-[current=page]:border-edge aria-[current=page]:bg-surface aria-[current=page]:font-semibold aria-[current=page]:text-text aria-[current=page]:shadow-stamp"
        >
          <Settings size={20} strokeWidth={2} aria-hidden />
          Ajustes
        </Link>
        <ThemeSelect theme={theme} onChange={onThemeChange} />
      </div>
    </aside>
  );
}

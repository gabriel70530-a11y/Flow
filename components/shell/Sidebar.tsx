import { Settings } from "lucide-react";
import Link from "next/link";
import type { Theme } from "@/store/study-store";
import { NAV_ITEMS } from "./nav-items";
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
    <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col gap-1 border-r border-line bg-surface pt-[calc(20px+env(safe-area-inset-top,0px))] pr-3 pb-[calc(16px+env(safe-area-inset-bottom,0px))] pl-[max(12px,env(safe-area-inset-left,0px))] md:flex">
      <div className="self-start px-3 pt-1 pb-6">
        <Wordmark />
      </div>
      <nav className="contents">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname.startsWith(href) ? "page" : undefined}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-text hover:bg-hover aria-[current=page]:bg-accent-soft aria-[current=page]:font-semibold aria-[current=page]:text-accent"
          >
            <Icon size={22} strokeWidth={2} aria-hidden />
            {label}
            {href === "/timer" && timerText && (
              <span className="ml-auto text-[13px] font-normal text-muted tabular-nums">{timerText}</span>
            )}
            {href === "/revisoes" && dueReviews > 0 && (
              <span className="ml-auto rounded-full bg-danger px-[7px] py-px text-xs font-semibold text-on-accent tabular-nums">
                {dueReviews}
              </span>
            )}
          </Link>
        ))}
      </nav>
      <div className="mt-auto grid gap-3">
        <Link
          href="/ajustes"
          aria-current={pathname.startsWith("/ajustes") ? "page" : undefined}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-text hover:bg-hover aria-[current=page]:bg-accent-soft aria-[current=page]:font-semibold aria-[current=page]:text-accent"
        >
          <Settings size={22} strokeWidth={2} aria-hidden />
          Ajustes
        </Link>
        <ThemeSelect theme={theme} onChange={onThemeChange} />
      </div>
    </aside>
  );
}

import Link from "next/link";
import { NAV_ITEMS } from "./nav-items";

interface TabBarProps {
  pathname: string;
  dueReviews: number;
  timerText: string | null;
}

export function TabBar({ pathname, dueReviews, timerText }: TabBarProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-surface pt-1.5 pr-[max(8px,env(safe-area-inset-right,0px))] pb-[calc(6px+env(safe-area-inset-bottom,0px))] pl-[max(8px,env(safe-area-inset-left,0px))] md:hidden">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname.startsWith(href) ? "page" : undefined}
          className="relative flex flex-col items-center gap-0.5 py-1 text-[11px] font-medium text-muted aria-[current=page]:font-semibold aria-[current=page]:text-accent"
        >
          <Icon size={22} strokeWidth={2} aria-hidden />
          {href === "/timer" && timerText ? (
            <span className="tabular-nums">
              <span className="sr-only">Timer, </span>
              {timerText}
            </span>
          ) : (
            label
          )}
          {href === "/revisoes" && dueReviews > 0 && (
            <span className="absolute top-0 left-[calc(50%+6px)] rounded-full bg-danger px-[5px] text-[10px] font-bold text-white tabular-nums">
              {dueReviews}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}

"use client";

import { Contrast } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, type ReactNode } from "react";
import { toDateKey } from "@/lib/dates";
import { groupReviews, pendingReviews } from "@/lib/reviews";
import { useTimerTicker } from "@/components/timer/use-timer-ticker";
import { IconButton } from "@/components/ui/IconButton";
import { Toast } from "@/components/ui/Toast";
import { useHydrated, useStudyStore, type Theme } from "@/store/study-store";
import { DemoNotice } from "./DemoNotice";
import { SaveFailureNotice } from "./SaveFailureNotice";
import { Sidebar } from "./Sidebar";
import { TabBar } from "./TabBar";
import { THEME_OPTIONS } from "./ThemeSelect";
import { Wordmark } from "./Wordmark";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const storedTheme = useStudyStore((state) => state.theme);
  const progress = useStudyStore((state) => state.progress);
  const topics = useStudyStore((state) => state.topics);
  const demo = useStudyStore((state) => state.demo);
  const setTheme = useStudyStore((state) => state.setTheme);
  const timerText = useTimerTicker(hydrated);

  // Até hidratar, o servidor e o primeiro render do cliente precisam mostrar a mesma coisa.
  const theme: Theme = hydrated ? storedTheme : "system";
  const dueReviews = useMemo(() => {
    if (!hydrated) return 0;
    const groups = groupReviews(pendingReviews(progress, topics), toDateKey(new Date()));
    return groups.late.length + groups.today.length;
  }, [hydrated, progress, topics]);

  useEffect(() => {
    if (!hydrated) return;
    if (theme === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.dataset.theme = theme;
  }, [hydrated, theme]);

  const cycleTheme = () => {
    const index = THEME_OPTIONS.findIndex((option) => option.value === theme);
    setTheme(THEME_OPTIONS[(index + 1) % THEME_OPTIONS.length].value);
  };

  return (
    <>
      <Sidebar
        pathname={pathname}
        dueReviews={dueReviews}
        timerText={timerText}
        theme={theme}
        onThemeChange={setTheme}
      />

      <header className="sticky top-[env(safe-area-inset-top,0px)] z-20 flex h-[52px] items-center justify-between border-b border-line bg-surface pr-[max(16px,env(safe-area-inset-right,0px))] pl-[max(16px,env(safe-area-inset-left,0px))] md:hidden">
        <Wordmark compact />
        <IconButton onClick={cycleTheme} aria-label="Alternar aparência">
          <Contrast size={20} aria-hidden />
        </IconButton>
      </header>

      <main className="max-w-[1180px] pt-5 pr-[max(16px,env(safe-area-inset-right,0px))] pb-[calc(84px+env(safe-area-inset-bottom,0px))] pl-[max(16px,env(safe-area-inset-left,0px))] md:ml-60 md:pt-[calc(28px+env(safe-area-inset-top,0px))] md:pr-[max(32px,env(safe-area-inset-right,0px))] md:pb-12 md:pl-[max(32px,env(safe-area-inset-left,0px))]">
        <SaveFailureNotice />
        {hydrated && demo && <DemoNotice />}
        {children}
      </main>

      <TabBar pathname={pathname} dueReviews={dueReviews} timerText={timerText} />
      <Toast />
    </>
  );
}

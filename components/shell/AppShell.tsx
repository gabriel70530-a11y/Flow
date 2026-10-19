"use client";

import { Contrast, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, type ReactNode } from "react";
import { toDateKey } from "@/lib/dates";
import { dueCards } from "@/lib/flashcards";
import { dueMistakes } from "@/lib/mistakes";
import { groupReviews, pendingReviews } from "@/lib/reviews";
import { useTimerTicker } from "@/components/timer/use-timer-ticker";
import { IconButton } from "@/components/ui/IconButton";
import { SkipLink } from "@/components/ui/SkipLink";
import { Toast, showToast } from "@/components/ui/Toast";
import { useProAccess } from "@/store/pro";
import { useHydrated, useStudyStore, type Theme } from "@/store/study-store";
import { DemoNotice } from "./DemoNotice";
import { SaveFailureNotice } from "./SaveFailureNotice";
import { Sidebar } from "./Sidebar";
import { TabBar } from "./TabBar";
import { THEME_OPTIONS } from "./ThemeSelect";
import { useReminders } from "./use-reminders";
import { WelcomeGuide } from "./WelcomeGuide";
import { Wordmark } from "./Wordmark";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const storedTheme = useStudyStore((state) => state.theme);
  const progress = useStudyStore((state) => state.progress);
  const topics = useStudyStore((state) => state.topics);
  const mistakes = useStudyStore((state) => state.mistakes);
  const flashcards = useStudyStore((state) => state.flashcards);
  const demo = useStudyStore((state) => state.demo);
  const setTheme = useStudyStore((state) => state.setTheme);
  const timerText = useTimerTicker(hydrated);
  useReminders(hydrated);
  const pro = useProAccess();

  // Até hidratar, o servidor e o primeiro render do cliente precisam mostrar a mesma coisa.
  const theme: Theme = hydrated ? storedTheme : "system";
  const dueReviews = useMemo(() => {
    if (!hydrated) return 0;
    const today = toDateKey(new Date());
    const groups = groupReviews(pendingReviews(progress, topics), today);
    return groups.late.length + groups.today.length + (pro ? dueMistakes(mistakes, today).length : 0) + dueCards(flashcards, today).length;
  }, [hydrated, progress, topics, mistakes, flashcards, pro]);

  useEffect(() => {
    if (!hydrated) return;
    const { trackEvent, carryOver } = useStudyStore.getState();
    trackEvent("app_aberto");
    const moved = carryOver();
    if (moved.length === 1) showToast("Uma matéria que ficou sem estudo passou para o próximo dia.");
    else if (moved.length > 1) showToast(`${moved.length} matérias que ficaram sem estudo passaram para os próximos dias.`);
  }, [hydrated]);

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
      <SkipLink />
      <Sidebar
        pathname={pathname}
        dueReviews={dueReviews}
        timerText={timerText}
        theme={theme}
        onThemeChange={setTheme}
      />

      <header className="sticky top-[env(safe-area-inset-top,0px)] z-20 flex h-[60px] items-center justify-between border-b border-line bg-surface pr-[max(16px,env(safe-area-inset-right,0px))] pl-[max(16px,env(safe-area-inset-left,0px))] md:hidden">
        <Wordmark size="sm" />
        <div className="flex items-center gap-2">
          <Link
            href="/ajustes"
            aria-label="Ajustes"
            aria-current={pathname.startsWith("/ajustes") ? "page" : undefined}
            className="grid size-[38px] place-items-center rounded-full text-muted hover:bg-hover aria-[current=page]:text-accent"
          >
            <Settings size={20} aria-hidden />
          </Link>
          <IconButton onClick={cycleTheme} aria-label="Alternar aparência" className="size-[38px] text-muted hover:bg-hover">
            <Contrast size={20} aria-hidden />
          </IconButton>
        </div>
      </header>

      <main id="conteudo" tabIndex={-1} className="max-w-[1180px] outline-none has-[[data-wide]]:max-w-none pt-5 pr-[max(16px,env(safe-area-inset-right,0px))] pb-[calc(84px+env(safe-area-inset-bottom,0px))] pl-[max(16px,env(safe-area-inset-left,0px))] md:ml-60 md:pt-[calc(40px+env(safe-area-inset-top,0px))] md:pr-[max(48px,env(safe-area-inset-right,0px))] md:pb-14 md:pl-[max(24px,env(safe-area-inset-left,0px))]">
        <SaveFailureNotice />
        {hydrated && demo && <DemoNotice />}
        {children}
      </main>

      <TabBar pathname={pathname} dueReviews={dueReviews} timerText={timerText} />
      {hydrated && <WelcomeGuide />}
      <Toast />
    </>
  );
}

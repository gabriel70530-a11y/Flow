"use client";

import { X } from "lucide-react";
import { useEffect, useEffectEvent, useId, useRef, type ReactNode } from "react";
import { IconButton } from "./IconButton";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  eyebrow: string;
  title: string;
  children: ReactNode;
}

export function Drawer({ open, onClose, eyebrow, title, children }: DrawerProps) {
  const titleId = useId();
  const closeButton = useRef<HTMLButtonElement>(null);
  const closeOnEscape = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape") onClose();
  });

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButton.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => closeOnEscape(event);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/35" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed inset-x-0 bottom-0 z-31 flex max-h-[88%] flex-col overflow-y-auto rounded-t-2xl border-t-2 border-edge bg-surface md:border-t-0 md:border-l-2 pt-4 pr-[max(20px,env(safe-area-inset-right,0px))] pb-[calc(24px+env(safe-area-inset-bottom,0px))] pl-[max(20px,env(safe-area-inset-left,0px))] shadow-[-8px_0_24px_rgba(0,0,0,0.12)] md:top-0 md:left-auto md:max-h-none md:w-[min(420px,100%)] md:rounded-none md:pt-[calc(16px+env(safe-area-inset-top,0px))] md:pr-[max(24px,env(safe-area-inset-right,0px))] md:pl-6"
      >
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <span className="text-[13px] text-muted">{eyebrow}</span>
            <h2 id={titleId} className="mt-1 text-[20px]">
              {title}
            </h2>
          </div>
          <IconButton ref={closeButton} onClick={onClose} aria-label="Fechar">
            <X size={20} strokeWidth={2.2} aria-hidden />
          </IconButton>
        </div>
        {children}
      </aside>
    </>
  );
}

export function DrawerSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-2.5 border-t border-line py-4">
      <h3 className="text-[13px] font-semibold text-muted">{title}</h3>
      {children}
    </section>
  );
}

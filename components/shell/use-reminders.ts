"use client";

import { useEffect, useState } from "react";
import { nextReminder, reminderText, type ReminderMoment } from "@/lib/reminders";
import { updatePushReminder, useCloud } from "@/store/cloud";
import { useStudyStore } from "@/store/study-store";

export function notificationsAllowed(): boolean {
  return typeof Notification !== "undefined" && Notification.permission === "granted";
}

async function showReminder(moment: ReminderMoment, time: string) {
  const { title, body } = reminderText(moment.offset, time);
  const options = { body, tag: moment.tag, icon: "/icon.svg", data: { url: "/painel" } };
  const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
  if (registration) await registration.showNotification(title, options);
  else new Notification(title, options);
}

// Roda no AppShell. Com o app aberto, o próprio navegador avisa na hora; com ele fechado, quem avisa é o servidor (push).
// Os dois usam a mesma tag, então o sistema mostra um aviso só.
export function useReminders(hydrated: boolean) {
  const reminder = useStudyStore((state) => state.reminder);
  const remindersOn = useStudyStore((state) => state.remindersOn);
  const studyDays = useStudyStore((state) => state.planner.studyDays);
  const signedIn = useCloud((state) => state.email !== null);
  const [fired, setFired] = useState(0);
  const active = hydrated && remindersOn && reminder.time !== null;

  useEffect(() => {
    if (!active || !reminder.time || !notificationsAllowed()) return;
    const next = nextReminder(new Date(), reminder, studyDays);
    if (!next) return;
    const time = reminder.time;
    const timeout = setTimeout(
      () => {
        showReminder(next, time).catch(() => {});
        setFired((count) => count + 1);
      },
      Math.max(0, next.at.getTime() - Date.now()),
    );
    return () => clearTimeout(timeout);
  }, [active, reminder, studyDays, fired]);

  useEffect(() => {
    if (!hydrated || !signedIn) return;
    const settings = active && reminder.time && notificationsAllowed() ? { time: reminder.time, studyDays } : null;
    void updatePushReminder(settings);
  }, [hydrated, signedIn, active, reminder.time, studyDays]);
}

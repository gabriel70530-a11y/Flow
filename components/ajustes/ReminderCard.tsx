"use client";

import { useState } from "react";
import { notificationsAllowed } from "@/components/shell/use-reminders";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, inputStyles } from "@/components/ui/Field";
import { Toggle } from "@/components/ui/Toggle";
import { pushAvailable, useCloud } from "@/store/cloud";
import { useStudyStore } from "@/store/study-store";

const WEEKDAYS = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

export function ReminderCard() {
  const reminder = useStudyStore((state) => state.reminder);
  const remindersOn = useStudyStore((state) => state.remindersOn);
  const studyDays = useStudyStore((state) => state.planner.studyDays);
  const { setReminderTime, setRemindersOn } = useStudyStore.getState();
  const signedIn = useCloud((state) => state.email !== null);
  const [blocked, setBlocked] = useState(() => typeof Notification !== "undefined" && Notification.permission === "denied");
  const supported = typeof Notification !== "undefined";
  const days = WEEKDAYS.filter((_, index) => studyDays[index]);

  const toggle = async (on: boolean) => {
    if (!on) {
      setRemindersOn(false);
      return;
    }
    const permission = notificationsAllowed() ? "granted" : await Notification.requestPermission();
    setBlocked(permission === "denied");
    setRemindersOn(permission === "granted");
  };

  const status = !supported
    ? "Este navegador não mostra notificações. No celular, instale o Flow na tela inicial e tente por ele."
    : !reminder.time
      ? "Escolha um horário para ligar os avisos."
      : blocked
        ? "As notificações do Flow estão bloqueadas neste navegador. Libere nas configurações do site e ligue de novo."
        : days.length === 0
          ? "Marque seus dias de estudo no Cronograma: os avisos saem só nesses dias."
          : remindersOn
            ? `Avisos ligados neste aparelho, nos seus dias de estudo (${days.join(", ")}).${
                pushAvailable() && signedIn ? " Chegam mesmo com o Flow fechado." : " Aparecem enquanto o Flow estiver aberto."
              }`
            : "Os avisos são de cada aparelho: ligue em todos onde quiser ser lembrado.";

  return (
    <Card>
      <CardHeader title="Lembrete de estudo" />
      <div className="grid gap-2">
        <Field label="Seu melhor horário para estudar" hint="O horário é o mesmo em todos os seus aparelhos.">
          <input
            type="time"
            value={reminder.time ?? ""}
            onChange={(event) => setReminderTime(event.target.value || null)}
            className={`${inputStyles} max-w-40 tabular-nums`}
          />
        </Field>
        {supported && reminder.time && (
          <Toggle pressed={remindersOn && !blocked} onChange={(on) => void toggle(on)}>
            Avisar 1 hora antes, 30 minutos antes e na hora
          </Toggle>
        )}
        <p className="text-[13px] text-muted" aria-live="polite">
          {status}
        </p>
      </div>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Drawer, DrawerSection } from "@/components/ui/Drawer";
import { Segmented } from "@/components/ui/Segmented";
import { showToast } from "@/components/ui/Toast";
import {
  NOTE_MAX,
  REFLECTION_LABELS,
  SESSION_STATE_LABELS,
  needsReinforcement,
  type Reflection,
  type StudySession,
} from "@/lib/sessions";
import { formatDuration } from "@/lib/stats";
import { findTopic } from "@/lib/topics";
import { useStudyStore } from "@/store/study-store";
import { ReinforceSuggestion } from "./ReinforceSuggestion";
import { sessionTitle, timeFormat } from "./session-format";

const reflectionOptions = (Object.keys(REFLECTION_LABELS) as Reflection[]).map((value) => ({
  value,
  label: REFLECTION_LABELS[value],
}));

interface SessionDrawerProps {
  session: StudySession | undefined;
  onClose: () => void;
}

export function SessionDrawer({ session, onClose }: SessionDrawerProps) {
  const topics = useStudyStore((state) => state.topics);
  const { setSessionReflection, setSessionNote, deleteSession } = useStudyStore.getState();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (!session) return null;
  const topic = findTopic(topics, session.topicId);

  const remove = () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    deleteSession(session.id);
    onClose();
    showToast("Sessão excluída.");
  };

  return (
    <Drawer
      open
      onClose={onClose}
      eyebrow={`${timeFormat.format(session.start)}–${timeFormat.format(session.end)} · ${SESSION_STATE_LABELS[session.state]}`}
      title={sessionTitle(session, topics)}
    >
      <DrawerSection title="Foco registrado">
        <p className="tabular-nums">
          {formatDuration(session.sec)} no {session.mode === "pomodoro" ? "Pomodoro" : "Cronômetro"}. Pausas não contam.
        </p>
      </DrawerSection>

      <DrawerSection title="Como foi? (opcional)">
        <Segmented
          wrap
          options={reflectionOptions}
          value={session.reflection ?? null}
          onChange={(reflection) => setSessionReflection(session.id, reflection)}
        />
        {topic && <ReinforceSuggestion topic={topic} show={needsReinforcement(session.reflection)} />}
      </DrawerSection>

      <DrawerSection title="Nota (opcional)">
        <textarea
          key={session.id}
          defaultValue={session.note ?? ""}
          maxLength={NOTE_MAX}
          rows={3}
          onBlur={(event) => setSessionNote(session.id, event.target.value)}
          placeholder="O que ficou claro, o que travou, o que retomar."
          className="w-full resize-none rounded-[10px] border-2 border-line bg-surface px-3 py-2 focus:border-edge text-text"
          aria-label="Nota da sessão"
        />
        <span className="text-xs text-muted">A nota é salva quando você sai do campo.</span>
      </DrawerSection>

      <Button className="mt-auto w-full" size="lg" onClick={remove}>
        {confirmingDelete ? "Clique de novo para excluir" : "Excluir sessão"}
      </Button>
    </Drawer>
  );
}

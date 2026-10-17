"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Drawer, DrawerSection } from "@/components/ui/Drawer";
import { showToast } from "@/components/ui/Toast";
import { findArea } from "@/lib/syllabus";
import { restoreDefaultsChanges, type RestoreChange } from "@/lib/topics";
import { useStudyStore } from "@/store/study-store";

const CHANGE_LABELS: Record<RestoreChange, string> = {
  reexibir: "volta a aparecer",
  nome: "volta ao nome original",
  descricao: "perde a descrição editada",
  area: "volta para a área original",
  adicionar: "volta para a lista",
};

export function ManageTopicsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const topics = useStudyStore((state) => state.topics);
  const { setTopicHidden, restoreDefaultTopics } = useStudyStore.getState();
  const [confirmingRestore, setConfirmingRestore] = useState(false);

  const hidden = topics.filter((topic) => topic.hidden);
  const changes = restoreDefaultsChanges(topics);
  const close = () => {
    setConfirmingRestore(false);
    onClose();
  };

  const restore = () => {
    if (!confirmingRestore) {
      setConfirmingRestore(true);
      return;
    }
    restoreDefaultTopics();
    setConfirmingRestore(false);
    showToast("Lista padrão restaurada.");
  };

  return (
    <Drawer open={open} onClose={close} eyebrow="Matérias" title="Gerenciar tópicos">
      <DrawerSection title={`Ocultos (${hidden.length})`}>
        {hidden.length === 0 ? (
          <p className="text-[13px] text-muted">Nenhum tópico oculto. Para ocultar, abra um tópico na lista.</p>
        ) : (
          <ul className="grid gap-2">
            {hidden.map((topic) => (
              <li key={topic.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="block font-medium wrap-anywhere">{topic.name}</span>
                  <span className="text-[13px] text-muted">{findArea(topic.areaId).name}</span>
                </span>
                <Button onClick={() => setTopicHidden(topic.id, false)}>Reexibir</Button>
              </li>
            ))}
          </ul>
        )}
      </DrawerSection>

      <DrawerSection title="Lista padrão">
        {changes.length === 0 ? (
          <p className="text-[13px] text-muted">Os tópicos padrão estão como vieram. Nada a restaurar.</p>
        ) : (
          <>
            <p className="text-[13px] text-muted">
              Restaurar mexe só nos tópicos padrão abaixo. Prioridade, progresso, sessões, revisões e tópicos
              personalizados ficam como estão.
            </p>
            <ul className="grid gap-1 text-sm">
              {changes.map(({ topic, changes: topicChanges }) => (
                <li key={topic.id}>
                  <span className="font-medium">{topic.name}</span>{" "}
                  <span className="text-muted">{topicChanges.map((change) => CHANGE_LABELS[change]).join(", ")}</span>
                </li>
              ))}
            </ul>
            <Button onClick={restore} className="justify-self-start">
              {confirmingRestore
                ? `Confirmar: restaurar ${changes.length} ${changes.length === 1 ? "tópico" : "tópicos"}`
                : "Restaurar lista padrão"}
            </Button>
          </>
        )}
      </DrawerSection>
    </Drawer>
  );
}

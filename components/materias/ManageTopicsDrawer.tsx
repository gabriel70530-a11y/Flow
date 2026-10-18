"use client";

import { Button } from "@/components/ui/Button";
import { Drawer, DrawerSection } from "@/components/ui/Drawer";
import { showToast } from "@/components/ui/Toast";
import { findArea } from "@/lib/syllabus";
import { useStudyStore } from "@/store/study-store";

export function ManageTopicsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const topics = useStudyStore((state) => state.topics);
  const setTopicHidden = useStudyStore((state) => state.setTopicHidden);
  const hidden = topics.filter((topic) => topic.hidden);

  return (
    <Drawer open={open} onClose={onClose} eyebrow="Matérias" title="Tópicos ocultos">
      <DrawerSection title={`Ocultos (${hidden.length})`}>
        {hidden.length === 0 ? (
          <p className="text-[13px] text-muted">
            Nenhum tópico oculto. Ocultar tira o tópico das listas e do cronograma sem apagar o histórico; para isso, abra o tópico
            na lista.
          </p>
        ) : (
          <ul className="grid gap-2">
            {hidden.map((topic) => (
              <li key={topic.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="block font-medium wrap-anywhere">{topic.name}</span>
                  <span className="text-[13px] text-muted">{findArea(topic.areaId).name}</span>
                </span>
                <Button
                  onClick={() => {
                    setTopicHidden(topic.id, false);
                    showToast("Tópico de volta à lista.");
                  }}
                >
                  Reexibir
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DrawerSection>
    </Drawer>
  );
}

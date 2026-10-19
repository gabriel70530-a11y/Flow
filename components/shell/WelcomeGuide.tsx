"use client";

import { CalendarCheck, CalendarDays, LayoutDashboard, Timer, TimerReset, Trophy, type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { useStudyStore } from "@/store/study-store";

const STEPS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: LayoutDashboard, title: "Painel", text: "As matérias de hoje, o tempo estudado e a semana." },
  { icon: CalendarDays, title: "Cronograma", text: "Até 2 matérias por dia, sem limite de horas." },
  { icon: Timer, title: "Timer", text: "Escolha o que vai estudar e comece. O tempo vai para o Painel." },
  { icon: CalendarCheck, title: "Revisões", text: "Tópicos, erros e cartões voltam na hora certa." },
  { icon: TimerReset, title: "Preparação", text: "Questões, simulados com nota estimada, redação e tabuada." },
  { icon: Trophy, title: "Conquistas", text: "Seu ritmo vira conquistas. Sem pressão." },
];

// Mostrado uma vez, depois de montar (ou pular) o plano. Dá para rever em Ajustes.
export function WelcomeGuide() {
  const guideSeen = useStudyStore((state) => state.guideSeen);
  const onboarding = useStudyStore((state) => state.onboarding.status);
  const setGuideSeen = useStudyStore((state) => state.setGuideSeen);
  const pathname = usePathname();
  const [step, setStep] = useState(0);
  const open = !guideSeen && onboarding !== "pendente" && pathname !== "/comecar";
  const { icon: Icon, title, text } = STEPS[step];
  const last = step === STEPS.length - 1;

  const close = () => {
    setGuideSeen(true);
    setStep(0);
  };

  return (
    <Drawer open={open} onClose={close} eyebrow={`Conheça o Flow · ${step + 1} de ${STEPS.length}`} title={title}>
      <div className="grid gap-6">
        <div className="grid justify-items-center gap-4 py-2 text-center">
          <span className="grid size-16 place-items-center rounded-[18px] border-2 border-edge bg-action text-on-action shadow-card">
            <Icon size={30} aria-hidden />
          </span>
          <p className="max-w-xs text-base">{text}</p>
        </div>
        <div className="flex justify-center gap-1.5" aria-hidden>
          {STEPS.map((item, index) => (
            <span key={item.title} className={`h-2 rounded-full ${index === step ? "w-5 bg-action" : "w-2 bg-track"}`} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button size="lg" onClick={step === 0 ? close : () => setStep(step - 1)}>
            {step === 0 ? "Pular" : "Voltar"}
          </Button>
          <Button variant="primary" size="lg" onClick={last ? close : () => setStep(step + 1)}>
            {last ? "Começar" : "Próximo"}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

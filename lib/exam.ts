import { addDays, fromDateKey } from "./dates";

// Datas divulgadas pelo Inep para o Enem 2026. Servem só de sugestão quando a pessoa ainda não informou a data da prova.
export const ENEM_DATES = { first: "2026-11-08", second: "2026-11-15" } as const;

// Nas últimas 4 semanas antes da prova, o plano prioriza revisar o que já foi estudado em vez de abrir conteúdo novo.
export const FINAL_STRETCH_DAYS = 28;

export function daysUntil(date: string, today: string): number {
  return Math.round((fromDateKey(date).getTime() - fromDateKey(today).getTime()) / 86_400_000);
}

export function isFinalStretch(targetDate: string | null, today: string): boolean {
  if (!targetDate) return false;
  const remaining = daysUntil(targetDate, today);
  return remaining >= 0 && remaining <= FINAL_STRETCH_DAYS;
}

// O Enem tem dois domingos seguidos; se a data informada for a do primeiro dia, o segundo é uma semana depois.
export function secondExamDay(targetDate: string): string {
  return targetDate === ENEM_DATES.first ? ENEM_DATES.second : addDays(targetDate, 7);
}

export function suggestedExamDate(today: string): string | null {
  return today <= ENEM_DATES.first ? ENEM_DATES.first : null;
}

export function countdownLabel(targetDate: string, today: string): string {
  const remaining = daysUntil(targetDate, today);
  if (remaining === 0) return "A prova é hoje";
  if (remaining === 1) return "A prova é amanhã";
  return `${remaining} dias para a prova`;
}

export interface ChecklistItem {
  id: string;
  label: string;
  hint?: string;
}

export interface ChecklistGroup {
  title: string;
  items: ChecklistItem[];
}

export type ExamDay = 1 | 2;

// O que conferir antes de cada dia. As regras completas estão no edital; os textos pedem para confirmar no cartão de confirmação.
export function examChecklist(day: ExamDay): ChecklistGroup[] {
  const content =
    day === 1
      ? "Linguagens, Ciências Humanas e Redação: 90 questões e a redação em 5h30."
      : "Ciências da Natureza e Matemática: 90 questões em 5h. Calculadora não é permitida.";
  return [
    {
      title: "Na semana",
      items: [
        { id: `d${day}-local`, label: "Conferi o local de prova no cartão de confirmação", hint: "Página do Participante, no site do Inep." },
        { id: `d${day}-rota`, label: "Sei como chegar e quanto tempo leva", hint: "Saia com folga: os portões fecham pontualmente." },
        { id: `d${day}-conteudo`, label: "Sei o que cai neste dia", hint: content },
        { id: `d${day}-revisao`, label: "Revisei só o que já estudei, sem matéria nova" },
      ],
    },
    {
      title: "Separar na véspera",
      items: [
        { id: `d${day}-documento`, label: "Documento oficial com foto, original", hint: "Também vale a versão digital aceita pelo edital." },
        { id: `d${day}-caneta`, label: "Caneta esferográfica de tinta preta, de tubo transparente" },
        { id: `d${day}-cartao`, label: "Cartão de confirmação impresso", hint: "Recomendado, não obrigatório." },
        { id: `d${day}-lanche`, label: "Água e lanche" },
        { id: `d${day}-sono`, label: "Dormir cedo, sem virar a noite estudando" },
      ],
    },
    {
      title: "Durante a prova",
      items: [
        { id: `d${day}-celular`, label: "Celular desligado e guardado no envelope porta-objetos" },
        {
          id: `d${day}-ritmo`,
          label: day === 1 ? "Reservar cerca de 1h para a redação" : "Cerca de 3 minutos por questão",
          hint: "Se uma questão travar, pule e volte depois.",
        },
        { id: `d${day}-faceis`, label: "Garantir as questões fáceis primeiro", hint: "Na nota do Enem, errar questões fáceis pesa mais." },
        { id: `d${day}-gabarito`, label: "Passar as respostas para o cartão-resposta com tempo" },
      ],
    },
  ];
}

export function checklistIds(day: ExamDay): string[] {
  return examChecklist(day).flatMap((group) => group.items.map((item) => item.id));
}

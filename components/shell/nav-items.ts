import {
  Book,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  Grid3x3,
  LayoutDashboard,
  ListChecks,
  PenLine,
  Timer,
  TimerReset,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  href: "/painel" | "/cronograma" | "/materias" | "/timer" | "/revisoes";
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/painel", label: "Painel", icon: LayoutDashboard },
  { href: "/cronograma", label: "Cronograma", icon: CalendarDays },
  { href: "/materias", label: "Matérias", icon: Book },
  { href: "/timer", label: "Timer", icon: Timer },
  { href: "/revisoes", label: "Revisões", icon: CalendarCheck },
];

// Ferramentas de preparação: ficam fora das abas do celular (que chegam pelo Painel) e num grupo discreto da barra lateral.
export const PREP_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/questoes", label: "Questões", icon: ListChecks },
  { href: "/simulados", label: "Simulados", icon: TimerReset },
  { href: "/redacao", label: "Redação", icon: PenLine },
  { href: "/tabuada", label: "Tabuada", icon: Grid3x3 },
  { href: "/prova", label: "Dia da prova", icon: ClipboardCheck },
];

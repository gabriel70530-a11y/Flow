import {
  Book,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  Grid3x3,
  Layers,
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

// Ferramentas de preparação: um grupo discreto na barra lateral e, no celular, a tela Preparação (aberta pelo Painel).
export const PREP_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/questoes", label: "Questões", icon: ListChecks },
  { href: "/simulados", label: "Simulados", icon: TimerReset },
  { href: "/redacao", label: "Redação", icon: PenLine },
  { href: "/revisoes/cartoes", label: "Cartões", icon: Layers },
  { href: "/tabuada", label: "Tabuada", icon: Grid3x3 },
  { href: "/prova", label: "Dia da prova", icon: ClipboardCheck },
];

// Cartões fica em Revisões e também na Preparação: na barra lateral, só um dos dois aparece ativo.
export function isCurrentPath(pathname: string, href: string): boolean {
  if (href === "/revisoes" && pathname.startsWith("/revisoes/cartoes")) return false;
  return pathname.startsWith(href);
}

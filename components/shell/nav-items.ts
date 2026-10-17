import { Book, CalendarCheck, LayoutDashboard, Timer, type LucideIcon } from "lucide-react";

interface NavItem {
  href: "/painel" | "/materias" | "/timer" | "/revisoes";
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/painel", label: "Painel", icon: LayoutDashboard },
  { href: "/materias", label: "Matérias", icon: Book },
  { href: "/timer", label: "Timer", icon: Timer },
  { href: "/revisoes", label: "Revisões", icon: CalendarCheck },
];

import { dueLabel } from "@/lib/dates";

export function DueLabel({ due, today }: { due: string; today: string }) {
  const text = dueLabel(due, today);
  return due < today ? <span className="text-danger">{text}</span> : <>{text}</>;
}

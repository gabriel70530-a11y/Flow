import { STATUS_LABELS, type TopicStatus } from "@/lib/reviews";

const statusStyles: Record<TopicStatus, string> = {
  nao: "bg-hover text-muted",
  and: "bg-accent-soft text-accent",
  revisar: "bg-hover text-danger",
  concluido: "bg-success-soft text-success",
};

export function Pill({ status }: { status: TopicStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-[3px] text-xs font-semibold whitespace-nowrap ${statusStyles[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

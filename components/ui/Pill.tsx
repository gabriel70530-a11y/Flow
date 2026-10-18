import { STATUS_LABELS, type TopicStatus } from "@/lib/reviews";

const statusStyles: Record<TopicStatus, string> = {
  nao: "text-muted before:bg-muted before:opacity-50",
  and: "text-accent before:bg-mid",
  revisar: "text-danger before:bg-danger",
  concluido: "text-success before:bg-success",
};

// Status com bolinha e texto: a cor nunca é a única pista.
export function Pill({ status }: { status: TopicStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap before:size-[7px] before:rounded-full before:content-[''] ${statusStyles[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

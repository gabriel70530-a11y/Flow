// Prévia estática do painel. Os dados são inventados e a legenda diz isso.
const SAMPLE_TASKS = [
  { title: "Probabilidade", detail: "Matemática · 1h10 estudados", done: true },
  { title: "Revisão: Era Vargas", detail: "Ciências Humanas", done: false },
];

const SAMPLE_BARS = [55, 80, 40, 90, 65, 30, 0];
const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function AppPreview() {
  return (
    <figure className="grid gap-2">
      <div className="grid gap-4 rounded-xl bg-surface p-5 shadow-card" aria-hidden>
        <div className="flex items-center justify-between">
          <span className="font-heading text-[17px] font-semibold font-stretch-108%">Estudar hoje</span>
          <span className="text-[13px] text-muted">1 de 2 matérias dominadas</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-bar">
          <div className="h-full w-1/2 rounded-full bg-accent" />
        </div>
        <ul className="grid">
          {SAMPLE_TASKS.map((task) => (
            <li key={task.title} className="flex items-center justify-between gap-3 border-t border-line py-2.5 first:border-t-0">
              <span className="min-w-0">
                <span className={`block text-sm font-medium ${task.done ? "text-muted line-through" : ""}`}>{task.title}</span>
                <span className="text-[13px] text-muted">{task.detail}</span>
              </span>
              <span className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold ${task.done ? "text-success" : "bg-hover"}`}>
                {task.done ? "Dominada" : "Começar"}
              </span>
            </li>
          ))}
        </ul>
        <div className="grid h-24 grid-cols-7 items-end gap-2 border-t border-line pt-3">
          {SAMPLE_BARS.map((height, index) => (
            <div key={WEEKDAYS[index]} className="flex h-full flex-col items-center justify-end gap-1">
              <div className={`w-full max-w-7 rounded-t ${height >= 65 ? "bg-accent" : "bg-bar"}`} style={{ height: `${height}%` }} />
              <span className="text-[11px] text-muted">{WEEKDAYS[index]}</span>
            </div>
          ))}
        </div>
      </div>
      <figcaption className="text-center text-[13px] text-muted">Ilustração com dados fictícios.</figcaption>
    </figure>
  );
}

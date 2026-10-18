interface ProgressBarProps {
  value: number;
  thin?: boolean;
  label?: string;
  className?: string;
}

export function ProgressBar({ value, thin = false, label, className = "" }: ProgressBarProps) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      role={label ? "progressbar" : undefined}
      aria-label={label}
      aria-valuenow={label ? percent : undefined}
      aria-hidden={label ? undefined : true}
      className={`overflow-hidden rounded-full bg-track ${thin ? "h-1.5" : "h-2"} ${className}`}
    >
      <div
        className="h-full rounded-full bg-mid transition-[width] duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`rounded-[18px] border-2 border-line bg-surface ${className}`} />;
}

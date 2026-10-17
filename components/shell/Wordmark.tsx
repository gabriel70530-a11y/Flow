export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div
      role="img"
      aria-label="ENEM Flow"
      className="inline-grid font-heading text-text italic leading-none font-stretch-125%"
    >
      <b className={`font-extrabold tracking-[-0.01em] ${compact ? "text-[22px]" : "text-[30px]"}`}>ENEM</b>
      <span
        className={`mt-[3px] mr-[-0.45em] justify-self-end font-light tracking-[0.45em] ${compact ? "text-[9px]" : "text-[12px]"}`}
      >
        FLOW
      </span>
    </div>
  );
}

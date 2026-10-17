const SIZES = {
  sm: "text-[24px]",
  md: "text-[32px]",
  lg: "text-[64px] md:text-[88px]",
};

interface WordmarkProps {
  size?: keyof typeof SIZES;
  tagline?: boolean;
}

// A marca é "FLOW", recriada em texto. O ENEM só aparece no slogan, como nome da prova.
export function Wordmark({ size = "md", tagline = false }: WordmarkProps) {
  return (
    <div
      role="img"
      aria-label={tagline ? "Flow. Sua preparação para o ENEM, no ritmo certo." : "Flow"}
      className="inline-grid justify-items-center gap-[0.35em] font-heading text-text italic"
    >
      <span className={`${SIZES[size]} leading-none font-extrabold tracking-[0.02em] font-stretch-125%`}>FLOW</span>
      {tagline && (
        <span className="text-center text-[15px] leading-snug font-normal tracking-[0.08em] font-stretch-110% md:text-[18px]">
          Sua preparação para o ENEM,
          <br />
          no ritmo certo.
        </span>
      )}
    </div>
  );
}

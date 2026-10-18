const SIZES = {
  sm: "text-[24px]",
  md: "text-[30px]",
  lg: "text-[64px] md:text-[88px]",
};

interface WordmarkProps {
  size?: keyof typeof SIZES;
  tagline?: boolean;
  // Sobre a faixa azul, o nome fica branco nos dois temas.
  onHero?: boolean;
}

// Símbolo do app: o F em itálico sobre o azul profundo, com contorno e sombra de carimbo.
function BrandMark() {
  return (
    <span className="grid size-[1.2em] shrink-0 place-items-center rounded-[0.32em] border-2 border-edge bg-action shadow-stamp-sm">
      <svg viewBox="0 0 64 64" className="size-[0.8em]" aria-hidden>
        <path fill="#fff" d="M23 13h28l-2.4 8H31.2l-1.6 5.4h15.2l-2.4 8H27.2L22.4 51h-9.6z" />
      </svg>
    </span>
  );
}

// A marca é "FLOW", recriada em texto. O ENEM só aparece no slogan, como nome da prova.
export function Wordmark({ size = "md", tagline = false, onHero = false }: WordmarkProps) {
  if (tagline) {
    return (
      <div
        role="img"
        aria-label="Flow. Sua preparação para o ENEM, no ritmo certo."
        className="inline-grid justify-items-center gap-[0.35em] font-heading text-brand italic"
      >
        <span className={`${SIZES[size]} leading-none font-extrabold tracking-[0.02em] font-stretch-125%`}>FLOW</span>
        <span className="text-center text-[15px] leading-snug font-normal tracking-[0.08em] font-stretch-110% md:text-[18px]">
          Sua preparação para o ENEM,
          <br />
          no ritmo certo.
        </span>
      </div>
    );
  }
  return (
    <div
      role="img"
      aria-label="Flow"
      className={`inline-flex items-center gap-[0.3em] font-heading leading-none font-extrabold tracking-[0.02em] italic font-stretch-125% ${onHero ? "text-white" : "text-brand"} ${SIZES[size]}`}
    >
      <BrandMark />
      FLOW
    </div>
  );
}

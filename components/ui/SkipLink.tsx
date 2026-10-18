// Primeiro item do Tab: leva direto ao conteúdo, sem passar pela navegação.
export function SkipLink() {
  return (
    <a
      href="#conteudo"
      className="sr-only rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
    >
      Pular para o conteúdo
    </a>
  );
}

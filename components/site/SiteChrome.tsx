import Link from "next/link";
import { linkStyles } from "@/components/ui/Button";
import { Wordmark } from "@/components/shell/Wordmark";
import { contactEmail } from "@/lib/plan";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b-2 border-white/10 bg-hero pt-[env(safe-area-inset-top,0px)] text-white">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-4 px-5 md:px-12">
        <Link href="/" aria-label="Flow, página inicial">
          <Wordmark size="sm" onHero />
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-white/80 md:flex" aria-label="Seções">
          <Link href="/#como-funciona" className="hover:text-white">
            Como funciona
          </Link>
          <Link href="/#planos" className="hover:text-white">
            Planos
          </Link>
          <Link href="/#perguntas" className="hover:text-white">
            Dúvidas
          </Link>
        </nav>
        <Link
          href="/painel"
          className="inline-flex h-9 items-center rounded-full bg-white px-4 text-sm font-semibold whitespace-nowrap text-action"
        >
          Abrir o app
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const email = contactEmail();
  return (
    <footer className="border-t-2 border-edge bg-surface pb-[env(safe-area-inset-bottom,0px)]">
      <div className="mx-auto grid max-w-6xl gap-4 px-5 py-10 text-sm text-muted md:px-12">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/privacidade" className={linkStyles}>
            Privacidade
          </Link>
          <Link href="/termos" className={linkStyles}>
            Termos de uso
          </Link>
          {email && (
            <a href={`mailto:${email}`} className={linkStyles}>
              Contato
            </a>
          )}
        </div>
        <p>
          O Flow é uma ferramenta independente de organização de estudos. Não é oficial e não tem vínculo com o INEP ou o
          MEC. Não promete nota nem aprovação.
        </p>
      </div>
    </footer>
  );
}

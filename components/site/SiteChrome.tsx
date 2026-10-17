import Link from "next/link";
import { buttonStyles, linkStyles } from "@/components/ui/Button";
import { Wordmark } from "@/components/shell/Wordmark";
import { contactEmail } from "@/lib/plan";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface pt-[env(safe-area-inset-top,0px)]">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 md:px-8">
        <Link href="/" aria-label="ENEM Flow, página inicial">
          <Wordmark compact />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex" aria-label="Seções">
          <a href="#como-funciona" className="hover:text-accent">
            Como funciona
          </a>
          <a href="#planos" className="hover:text-accent">
            Planos
          </a>
          <a href="#perguntas" className="hover:text-accent">
            Perguntas
          </a>
        </nav>
        <Link href="/painel" className={buttonStyles("primary")}>
          Abrir o app
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const email = contactEmail();
  return (
    <footer className="border-t border-line bg-surface pb-[env(safe-area-inset-bottom,0px)]">
      <div className="mx-auto grid max-w-5xl gap-4 px-4 py-8 text-sm text-muted md:px-8">
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
          O ENEM Flow é uma ferramenta independente de organização de estudos. Não é oficial e não tem vínculo com o INEP ou o
          MEC. Não promete nota nem aprovação.
        </p>
      </div>
    </footer>
  );
}

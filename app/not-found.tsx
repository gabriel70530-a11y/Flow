import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/shell/Wordmark";
import { buttonStyles } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Página não encontrada" };

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-content-center justify-items-center gap-5 px-4 text-center">
      <Wordmark size="lg" />
      <h1 className="font-heading text-[26px] font-bold font-stretch-112%">Página não encontrada</h1>
      <p className="max-w-[420px] text-muted">O endereço pode estar errado ou a página mudou de lugar.</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/painel" className={buttonStyles("primary")}>
          Abrir o app
        </Link>
        <Link href="/" className={buttonStyles()}>
          Ir para o início
        </Link>
      </div>
    </main>
  );
}

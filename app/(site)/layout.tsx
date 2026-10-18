import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { SkipLink } from "@/components/ui/SkipLink";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <SiteHeader />
      <main id="conteudo" tabIndex={-1} className="flex-1 outline-none pr-[env(safe-area-inset-right,0px)] pl-[env(safe-area-inset-left,0px)]">{children}</main>
      <SiteFooter />
    </div>
  );
}

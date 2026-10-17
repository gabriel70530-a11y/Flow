import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1 pr-[env(safe-area-inset-right,0px)] pl-[env(safe-area-inset-left,0px)]">{children}</main>
      <SiteFooter />
    </div>
  );
}

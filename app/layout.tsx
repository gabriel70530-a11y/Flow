import type { Metadata, Viewport } from "next";
import { Saira } from "next/font/google";
import { SITE_DESCRIPTION, SITE_TITLE, siteUrl } from "@/lib/site";
import { LEGACY_STORAGE_KEY, STORAGE_KEY } from "@/store/storage-key";
import "./globals.css";

const saira = Saira({
  subsets: ["latin"],
  axes: ["wdth"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: { default: SITE_TITLE, template: "%s · Flow" },
  description: SITE_DESCRIPTION,
  applicationName: "Flow",
  openGraph: { type: "website", locale: "pt_BR", siteName: "Flow", title: SITE_TITLE, description: SITE_DESCRIPTION },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION },
  appleWebApp: { title: "Flow", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f3ee" },
    { media: "(prefers-color-scheme: dark)", color: "#0b111c" },
  ],
};

// Roda antes da primeira pintura para não piscar o tema errado enquanto a store hidrata.
const themeScript = `(function(){try{var s=localStorage.getItem(${JSON.stringify(STORAGE_KEY)})||localStorage.getItem(${JSON.stringify(LEGACY_STORAGE_KEY)});var t=JSON.parse(s).theme;if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={saira.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

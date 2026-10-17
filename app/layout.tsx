import type { Metadata, Viewport } from "next";
import { Saira } from "next/font/google";
import { LEGACY_STORAGE_KEY, STORAGE_KEY } from "@/store/storage-key";
import "./globals.css";

const saira = Saira({
  subsets: ["latin"],
  axes: ["wdth"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "ENEM Flow",
  description: "Organizador pessoal de estudos para o ENEM.",
};

export const viewport: Viewport = {
  viewportFit: "cover",
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

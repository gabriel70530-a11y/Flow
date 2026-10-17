import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ENEM Flow",
  description: "Organizador pessoal de estudos para o ENEM.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "KRIEL — Arti i Bronzit | Shpërndarës zyrtar Caggiati",
  description:
    "Statuja, kryqe, llampa dhe kompozime përkujtimore origjinale nga fonderia Caggiati — bronz 87, punim manual, elegancë që i bën ballë kohës.",
};

export const viewport: Viewport = {
  themeColor: "#14110d",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sq">
      <body className="bg-ink text-ivory antialiased">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kriel — Aksesore dhe Artikuj Bronzi për Varre",

  description:
    "Kriel ofron aksesore bronzi, artikuj bronzi, aksesore për varre, artikuj për varre, germa për varre, korniza për varre, kryqe për varre, vende qiriu dhe vazo lulesh. Gjithashtu materiale, ngjitës, gurë lucidimi dhe disqe për mermer dhe granit.",

  keywords: [
    "Aksesore Bronzi",
    "Artikuj Bronzi",
    "Aksesore per varre",
    "Artikuj per varre",
    "Germa per varre",
    "Korniza per varre",
    "Kryqe per varre",
    "Vend qiriu",
    "Vazo lulesh",
    "Materiale mermeri dhe graniti",
    "Ngjites mermeri dhe graniti",
    "Gur lucidimi mermer granit",
    "Disk mermer granit",
  ],

  alternates: {
    canonical: "http://kriel.al",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sq">
      <body className="antialiased">{children}</body>
    </html>
  );
}

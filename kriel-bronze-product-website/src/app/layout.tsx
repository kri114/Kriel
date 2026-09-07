import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kriel — Arti i Bronzit",
  description:
    "Kriel — Statuja, kryqe, llampa, korniza, lule, vazo, targa dhe gërma origjinale në bronz. Katalog i plotë me çmime, personalizim me shkrim dhe porosi direkt online.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sq">
      <body className="antialiased">{children}</body>
    </html>
  );
}

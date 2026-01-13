import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Eltern-Kompass | Der Elterngeld-Optimierer",
  description:
    "Wie viel Elterngeld verschenkst du? Finde in 2 Minuten heraus, wie du durchschnittlich 2.400€ mehr Elterngeld bekommst.",
  keywords: [
    "elterngeld berechnen",
    "elterngeld optimieren",
    "elterngeld rechner",
    "elterngeldplus",
    "mutterschutz rechner",
  ],
  openGraph: {
    title: "Eltern-Kompass | Der Elterngeld-Optimierer",
    description:
      "Wie viel Elterngeld verschenkst du? Finde heraus, wie du mehr Elterngeld bekommst.",
    type: "website",
    locale: "de_DE",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

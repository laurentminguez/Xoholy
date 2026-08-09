import type { Metadata, Viewport } from "next";
import { Anton, Inter } from "next/font/google";

import "./globals.css";

// Anton carries the giant editorial headlines; Inter carries UI, body, and (as
// outlines, not live text) the wordmark. Both free — nothing is blocked on a licence.
// See packages/design/src/typography.ts for why these two and not one.
const anton = Anton({
  subsets: ["latin"],
  weight: ["400"], // Anton ships a single weight; it is already black by design.
  variable: "--font-anton",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "XOholy — Social media can be holy",
  description:
    "Real people. Real faith. Real life. A social platform where the whole feed is Christian — share what moves you, and be encouraged rather than depleted.",
  openGraph: {
    title: "XOholy — Social media can be holy",
    description: "Real people. Real faith. Real life.",
    siteName: "XOholy",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#11110F",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${anton.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}

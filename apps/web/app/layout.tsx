import type { Metadata, Viewport } from "next";
import { Archivo, Inter } from "next/font/google";

import "./globals.css";

// Display and UI faces, both variable and both free — nothing here is blocked on a
// font licence. See packages/design/src/typography.ts for why these two.
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-archivo",
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
    <html lang="en" className={`${archivo.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}

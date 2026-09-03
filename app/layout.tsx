import type { Metadata } from "next";
import { Nunito, JetBrains_Mono } from "next/font/google";
import "@/app/globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Educational Mentor AI — Independent Mode",
  description:
    "A learning platform that guides students toward independent problem-solving through progressive hints, reasoning evaluation, and adaptive difficulty.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${nunito.variable} ${jetbrains.variable}`}>
      <body className="font-sans text-ink-900 bg-ink-50 antialiased">{children}</body>
    </html>
  );
}

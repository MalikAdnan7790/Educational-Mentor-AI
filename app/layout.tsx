import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Noto_Naskh_Arabic } from "next/font/google";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });
const notoUrdu = Noto_Naskh_Arabic({ subsets: ["arabic"], variable: "--font-urdu", display: "swap" });

export const metadata: Metadata = {
  title: "Educational Mentor AI — Independent Mode",
  description:
    "A learning platform that guides students toward independent problem-solving through progressive hints, reasoning evaluation, and adaptive difficulty.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${notoUrdu.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}

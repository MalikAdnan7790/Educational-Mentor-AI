import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Educational Mentor AI — Independent Mode",
  description:
    "A learning platform that guides students toward independent problem-solving through progressive hints, reasoning evaluation, and adaptive difficulty.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

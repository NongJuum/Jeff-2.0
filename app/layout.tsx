import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "A-Tier Training Log",
  description: "Workout planner with substitutions, warmup flags, set/rep logging and PR tracking."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
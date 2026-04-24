import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jeff 2.0 Workout Tracker",
  description: "Mobile-first workout planner with substitutions, multi-set logging, PRs and warmup calculator.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}

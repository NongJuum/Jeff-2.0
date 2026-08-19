import React from "react";
import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "HA IT - Workout Tracker",
  description: "HA IT workout tracker with preset splits, custom builder, PRs, warmups and history.",
  applicationName: "HA IT",
  manifest: "/manifest.webmanifest",
  // Stop iOS from turning numbers (weights/reps/timers) into phone links
  formatDetection: { telephone: false, address: false, email: false },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  // iOS "Add to Home Screen" = native-app feel
  appleWebApp: {
    capable: true,
    title: "HA IT",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // REQUIRED so env(safe-area-inset-*) works (your safe-bottom nav)
  interactiveWidget: "resizes-content", // keyboard won't cover set inputs
  colorScheme: "dark", // dark native controls (selects, scrollbars, keyboard bar)
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="bg-zinc-950 antialiased">{children}</body>
    </html>
  );
}

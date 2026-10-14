import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PhysCheck AI — Физика есептерін тексеру",
  description:
    "Қолмен жазылған физика есептерін жасанды интеллект арқылы талдау және Сократтық бағыттау.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="kk">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
        {children}
      </body>
    </html>
  );
}

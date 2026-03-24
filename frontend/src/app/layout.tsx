import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DebateMeBro - AI Debate Engine",
  description: "Two AI agents research, argue, and steelman both sides of any topic — scored by judges.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-surface text-on-surface min-h-screen flex flex-col font-label">
        {children}
      </body>
    </html>
  );
}

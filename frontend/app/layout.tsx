import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { AuthGate } from "@/components/auth-gate";
import { SiteNav } from "@/components/site-nav";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Job Copilot - Honest resumes for any role",
  description:
    "Create, tailor, and export clean, ATS-friendly resumes for any role. Never fabricated - only your real experience, sharpened.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans">
        <AuthGate>
          <SiteNav />
          <main className="container py-8 md:py-12 animate-fade-in">{children}</main>
          <footer className="border-t border-border/60 py-6 no-print">
            <div className="container flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
              <p>Job Copilot · Groq + FastAPI + Next.js</p>
              <p>Honesty-first: your real experience, never fabricated.</p>
            </div>
          </footer>
        </AuthGate>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}

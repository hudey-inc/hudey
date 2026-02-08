import type { Metadata } from "next";
import localFont from "next/font/local";
import { AuthNav } from "@/components/auth-nav";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Hudey",
  description: "AI marketing agent for influencer campaigns",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-stone-50 text-stone-900`}
      >
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-4 flex items-center gap-6">
            <a href="/" className="text-xl font-semibold text-stone-900">
              Hudey
            </a>
            <nav className="flex gap-4 text-sm text-stone-600">
              <a href="/" className="hover:text-stone-900">
                Campaigns
              </a>
            </nav>
            <AuthNav />
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}

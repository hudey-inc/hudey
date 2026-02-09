import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hudey — AI-Powered Influencer Marketing",
  description:
    "Automate influencer campaigns with AI. Creator discovery, outreach, negotiation, and tracking — all in one platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-white text-gray-900">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

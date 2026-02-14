import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://hudey.co"),
  title: {
    default: "Hudey — AI-Powered Influencer Marketing Agent",
    template: "%s | Hudey",
  },
  description:
    "Automate influencer campaigns with AI. Hudey finds the right creators, writes personalized outreach, negotiates deals, and tracks results — all on autopilot.",
  keywords: [
    "influencer marketing",
    "AI marketing",
    "creator discovery",
    "influencer outreach",
    "campaign management",
    "influencer negotiation",
    "creator marketing agent",
    "automated influencer marketing",
    "AI influencer agent",
    "influencer campaign tracking",
  ],
  authors: [{ name: "Hudey" }],
  creator: "Hudey",
  publisher: "Hudey",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://hudey.co",
    siteName: "Hudey",
    title: "Hudey — AI-Powered Influencer Marketing Agent",
    description:
      "Stop managing influencers manually. Hudey's AI agents find creators, write outreach, negotiate deals, and track every result — while you focus on strategy.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hudey — AI-Powered Influencer Marketing Agent",
    description:
      "Stop managing influencers manually. Hudey's AI agents find creators, write outreach, negotiate deals, and track every result.",
    creator: "@hudeyco",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://hudey.co",
  },
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

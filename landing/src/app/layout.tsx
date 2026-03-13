import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

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
    <html lang="en" className={`${instrumentSerif.variable} ${inter.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Hudey",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              url: "https://hudey.co",
              description:
                "AI-powered influencer marketing platform that automates creator discovery, outreach, negotiation, and campaign tracking for sustainable brands.",
              offers: {
                "@type": "Offer",
                price: "250",
                priceCurrency: "GBP",
                description: "Per campaign, founding rate",
              },
              creator: {
                "@type": "Organization",
                name: "Hudey",
                url: "https://hudey.co",
                logo: "https://hudey.co/icon.png",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "How does Hudey find the right creators?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Our AI analyses engagement rates, audience demographics, content authenticity, and brand alignment to surface creators whose followers match your target audience and whose style fits your brand.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Do I have control over what messages are sent?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Absolutely. Hudey drafts personalised outreach messages and negotiation terms, but you approve everything before it goes out. You can edit messages, adjust offers, and set guidelines for the AI to follow.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What platforms does Hudey support?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Hudey currently supports Instagram, TikTok, YouTube, and X. We are constantly expanding based on customer demand, and you can manage all platforms from one dashboard.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How much time does Hudey save?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Our customers report saving 15-20 hours per week on discovery, outreach, and negotiation. What typically takes 3-4 weeks manually can be completed in 48 hours with Hudey.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Can I use Hudey with existing influencer relationships?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes. You can import current partners, track ongoing campaigns, and use analytics to measure performance alongside new creators Hudey discovers for you.",
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body className="font-sans antialiased bg-white text-gray-900">
        {children}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-7FVFE4G53B"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-7FVFE4G53B');
          `}
        </Script>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

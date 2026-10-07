import type { Metadata } from "next";

// The help page is a client component ("use client") and therefore
// cannot export metadata itself. This pass-through layout carries the
// route's title, description, and canonical instead.
export const metadata: Metadata = {
  title: "Help Centre",
  description:
    "Guides and answers for running influencer campaigns with Hudey — getting started, creator discovery, outreach, campaigns, and billing.",
  alternates: { canonical: "/help" },
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

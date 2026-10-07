/**
 * Canonical origin for the landing site.
 *
 * Vercel serves `www.hudey.co` as the primary domain — the apex
 * `hudey.co` 307-redirects to it. Every absolute URL we emit
 * (canonicals, sitemap, robots, Open Graph, JSON-LD) must therefore
 * use the www host, or crawlers see canonicals that point through a
 * redirect. If the primary domain ever flips to the apex in Vercel's
 * dashboard, update this one constant.
 */
export const SITE_URL = "https://www.hudey.co";

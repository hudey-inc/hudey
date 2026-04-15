import OGImage, { alt as ogAlt, size as ogSize, contentType as ogContentType } from "./opengraph-image";

// Twitter card uses the same image as Open Graph. Inline the config (instead of
// re-exporting) because Next.js only recognizes string-literal route segment
// exports, not re-exports from another module.
export const runtime = "edge";
export const alt = ogAlt;
export const size = ogSize;
export const contentType = ogContentType;

export default OGImage;

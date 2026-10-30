// Open Graph card images (T-061, D-051). scripts/og-images.ts renders one
// PNG card per case study and one for the rest of the site after the build;
// route `meta` functions point og:image at the same paths.

// The size LinkedIn, WhatsApp, Facebook and X all crop well (1.91:1).
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
export const OG_IMAGE_TYPE = "image/png";

// The site card (home, work index, about, lab and the other pages) or a case
// study's own card.
export function ogImagePath(slug?: string): string {
  return slug ? `/og/work/${slug}.png` : "/og/site.png";
}

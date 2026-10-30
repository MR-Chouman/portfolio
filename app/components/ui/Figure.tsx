export interface FigureProps {
  src: string;
  alt: string;
  caption: string;
  // Intrinsic size, required so the image reserves its space (no layout shift).
  width: number;
  height: number;
  // Above-the-fold images load eagerly; the rest wait until they are near.
  priority?: boolean;
}

// A captioned image for case studies (T-022). MDX files use it as
// <Figure src="..." alt="..." caption="..." width={..} height={..} /> without
// importing it: the case study route passes it in `components`. Styles come
// from `.prose-content` (base.css).
export function Figure({
  src,
  alt,
  caption,
  width,
  height,
  priority = false,
}: FigureProps) {
  return (
    <figure>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

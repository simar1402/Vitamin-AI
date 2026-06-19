"use client";

/* eslint-disable @next/next/no-img-element */
/**
 * Native <img> wrapper — works with any CDN without Next.js domain config.
 */
export function RemoteImage({
  src,
  alt,
  className,
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
    />
  );
}

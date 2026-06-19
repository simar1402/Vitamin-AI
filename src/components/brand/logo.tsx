import Image from "next/image";

const SIZE_MAP = {
  sm: { img: 24, text: "text-[15px]" },
  md: { img: 32, text: "text-[20px]" },
  lg: { img: 44, text: "text-[28px]" },
};

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const { img, text } = SIZE_MAP[size];
  return (
    <div className="flex items-center gap-2">
      <Image
        src="/logo-pill.png"
        alt="Vitamin-AI pill"
        width={img}
        height={img}
        className="shrink-0"
        priority
      />
      <span
        className={`${text} leading-none whitespace-nowrap tracking-tight text-foreground`}
        style={{ fontFamily: "var(--font-brand)", fontWeight: 600 }}
      >
        Vitamin-AI
      </span>
    </div>
  );
}

/** Standalone pill mark (used in hero animation etc.) */
export function PillMark({ height = 34 }: { height?: number }) {
  return (
    <Image
      src="/logo-pill.png"
      alt=""
      width={height}
      height={height}
      className="shrink-0"
      aria-hidden
    />
  );
}

import { cn } from "@/lib/utils";

type PageContainerSize = "default" | "narrow" | "wide" | "full";

const maxWidth: Record<PageContainerSize, string> = {
  default: "max-w-6xl",
  narrow: "max-w-2xl",
  wide: "max-w-[1400px]",
  full: "max-w-7xl",
};

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: PageContainerSize;
  /** Skip vertical padding when nested inside another shell */
  noPadding?: boolean;
}

export function PageContainer({
  children,
  className,
  size = "default",
  noPadding = false,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        maxWidth[size],
        "mx-auto w-full px-4 md:px-6 lg:px-8",
        !noPadding && "py-6 md:py-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

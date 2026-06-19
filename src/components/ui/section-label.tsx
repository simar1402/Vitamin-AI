import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}

/** Uppercase section heading used above chip groups and form sections */
export function SectionLabel({ children, className, htmlFor }: SectionLabelProps) {
  return (
    <Label
      htmlFor={htmlFor}
      className={cn(
        "text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block",
        className,
      )}
    >
      {children}
    </Label>
  );
}

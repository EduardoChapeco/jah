import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const surfaceVariants = cva("relative overflow-hidden transition-all duration-200", {
  variants: {
    variant: {
      default: "bg-background text-foreground border shadow-sm rounded-lg",
      zine: "bg-paper text-ink border-4 border-ink shadow-hard font-sans",
      flyer:
        "bg-primary text-primary-foreground border-4 border-ink shadow-hard font-display uppercase tracking-wider",
      "yellow-pages": "bg-directory-yellow text-ink border-2 border-ink font-mono text-sm shadow-md",
      ticket: "bg-background text-foreground border-[3px] border-dashed border-ink font-mono shadow-md",
      polaroid: "bg-paper text-ink p-4 pb-12 shadow-hard border-4 border-ink",
      cardboard: "bg-newsprint text-ink border-2 border-ink shadow-inner",
      charcoal: "bg-charcoal text-paper border-2 border-charcoal-surface shadow-hard",
      none: "bg-transparent text-foreground border-none shadow-none",
      lambe:
        "bg-primary text-primary-foreground border-4 border-ink shadow-hard font-display uppercase tracking-wider -rotate-1",
      journal: "bg-paper text-ink border-y-4 border-ink shadow-md font-serif",
      flat: "bg-background text-foreground border-none rounded-lg",
      muted: "bg-muted text-muted-foreground border-none rounded-lg",
      op: "card-op",
    },
    elevation: {
      none: "shadow-none",
      sm: "shadow-sm",
      md: "shadow-md",
      hard: "shadow-hard -translate-x-0.5 -translate-y-0.5",
    },
    padding: {
      none: "p-0",
      sm: "p-3",
      md: "p-6",
      lg: "p-10",
    },
  },
  defaultVariants: {
    variant: "default",
    elevation: "none",
    padding: "md",
  },
});

export interface SurfaceProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof surfaceVariants> {
  as?: React.ElementType;
}

const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  ({ className, variant, elevation, padding, as: Component = "div", ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(surfaceVariants({ variant, elevation, padding, className }))}
        {...props}
      />
    );
  },
);
Surface.displayName = "Surface";

export { Surface, surfaceVariants };

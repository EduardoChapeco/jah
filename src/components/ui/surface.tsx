import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const surfaceVariants = cva(
  "relative overflow-hidden transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border border-border shadow-sm rounded-md",
        zine: "bg-paper text-ink border-2 border-ink shadow-md font-sans",
        flyer: "bg-primary text-primary-foreground border-4 border-ink shadow-lg font-display uppercase tracking-wider",
        "yellow-pages": "bg-directory-yellow text-ink border-y border-ink/20 font-mono text-sm",
        ticket: "bg-background text-foreground border-2 border-dashed border-border font-mono",
        polaroid: "bg-ivory text-ink p-4 pb-12 shadow-sm border border-border",
        cardboard: "bg-newsprint text-ink border border-border shadow-inner",
        charcoal: "bg-charcoal text-ivory border border-charcoal-surface",
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
      }
    },
    defaultVariants: {
      variant: "default",
      elevation: "none",
      padding: "md",
    },
  }
)

export interface SurfaceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof surfaceVariants> {
  as?: React.ElementType
}

const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  ({ className, variant, elevation, padding, as: Component = "div", ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(surfaceVariants({ variant, elevation, padding, className }))}
        {...props}
      />
    )
  }
)
Surface.displayName = "Surface"

export { Surface, surfaceVariants }

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full  px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground bg-transparent",
        /** Informational status (e.g. "Approved", "Processing") — maps to --info token */
        info: "-transparent bg-info text-info-foreground hover:bg-info/80",
        /** Success status (e.g. "Refunded", "Delivered") — maps to --success token */
        success: "-transparent bg-success text-success-foreground hover:bg-success/80",
        /** Warning status (e.g. "Pending review") — maps to --warning token */
        warning: "-transparent bg-warning text-warning-foreground hover:bg-warning/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

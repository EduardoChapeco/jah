import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-none border-2 border-ink px-2.5 py-0.5 text-badge font-bold transition-transform focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-sm",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm",
        secondary: "bg-secondary text-secondary-foreground shadow-sm",
        destructive: "bg-destructive text-destructive-foreground shadow-sm stamp-badge",
        outline: "text-foreground bg-transparent",
        /** Informational status (e.g. "Approved", "Processing") — maps to --info token */
        info: "bg-info text-info-foreground shadow-sm",
        /** Success status (e.g. "Refunded", "Delivered") — maps to --success token */
        success: "bg-success text-success-foreground shadow-sm",
        /** Warning status (e.g. "Pending review") — maps to --warning token */
        warning: "bg-warning text-warning-foreground shadow-sm",
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

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface SquircleCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "organic" | "soft" | "media";
  interactive?: boolean;
  selected?: boolean;
  asChild?: boolean;
}

export const SquircleCard = React.forwardRef<HTMLDivElement, SquircleCardProps>(
  (
    {
      className,
      variant = "default",
      interactive = false,
      selected = false,
      asChild = false,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "div";

    const variantClass =
      variant === "organic"
        ? "squircle-organic"
        : variant === "soft"
          ? "squircle-soft"
          : variant === "media"
            ? "squircle-media"
            : "squircle";

    return (
      <Comp
        ref={ref}
        className={cn(
          "border border-border bg-card text-card-foreground p-5 relative select-none",
          variantClass,
          interactive && "squircle-hover cursor-pointer",
          selected && "squircle-selected",
          className,
        )}
        {...props}
      >
        {children}
      </Comp>
    );
  },
);
SquircleCard.displayName = "SquircleCard";

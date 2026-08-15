import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base: squircle-action por padrão — geometria pill orgânica em todo o sistema
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all duration-200 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:opacity-90 shadow-2xs font-bold border border-primary/20",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-2xs font-bold",
        outline:
          "border border-border/90 bg-background hover:bg-muted text-foreground hover:border-border font-semibold shadow-2xs",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 font-semibold border border-border/40 shadow-2xs",
        ghost: "hover:bg-muted hover:text-foreground text-muted-foreground",
        link: "text-primary underline-offset-4 hover:underline font-semibold",
        pillow:
          "rounded-full bg-primary text-primary-foreground font-bold shadow-xs hover:opacity-90 hover:scale-[1.02] active:scale-[0.97]",
        pillowOutline:
          "rounded-full border border-border/80 bg-card hover:bg-muted text-foreground font-bold shadow-2xs hover:scale-[1.02] active:scale-[0.97]",
        heroAction:
          "rounded-2xl bg-linear-to-r from-primary via-primary/90 to-primary text-primary-foreground font-black shadow-md hover:scale-[1.02] hover:shadow-lg active:scale-[0.97] border border-white/15",
      },
      size: {
        default: "h-11 px-5 py-2", /* 44px — padrão ergonômico Apple */
        sm: "h-8 px-3.5 text-xs rounded-xl", /* 32px — compacto */
        lg: "h-13 px-7 text-base font-bold rounded-2xl", /* 52px — destaque */
        icon: "size-10 rounded-xl",
        iconSm: "size-8 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Coloca o botão em estado de carregamento: desabilita interação, exibe spinner */
  isLoading?: boolean;
  /** Texto alternativo exibido enquanto carregando (padrão: conteúdo original com spinner) */
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      loadingText,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || isLoading;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-busy={isLoading}
        aria-disabled={isDisabled}
        {...props}
      >
        {isLoading ? (
          <>
            {/* Spinner canônico Jah */}
            <svg
              className="size-4 animate-spin shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="31.416"
                strokeDashoffset="10"
                opacity="0.35"
              />
              <path
                d="M12 2a10 10 0 0 1 10 10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <span>{loadingText ?? children}</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

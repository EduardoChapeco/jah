import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none border-2 border-border text-sm font-bold uppercase tracking-wider cursor-pointer transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none hover:-translate-y-0.5 hover:-translate-x-0.5",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg",
        destructive: "bg-destructive text-destructive-foreground shadow-brand hover:bg-destructive/90 hover:shadow-lg",
        outline:
          "bg-background shadow-md hover:bg-accent hover:text-accent-foreground hover:shadow-lg",
        secondary: "bg-secondary text-secondary-foreground shadow-md hover:bg-secondary/80 hover:shadow-lg",
        ghost: "border-transparent shadow-none hover:-translate-y-0 hover:-translate-x-0 active:translate-x-0 active:translate-y-0 hover:bg-accent hover:text-accent-foreground",
        link: "border-transparent shadow-none hover:-translate-y-0 hover:-translate-x-0 active:translate-x-0 active:translate-y-0 text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2",   /* 44px — mínimo iOS */
        sm: "h-9 px-3 text-xs",      /* 36px — apenas conteúdo compacto */
        lg: "h-12 px-8 text-base",   /* 48px */
        icon: "h-11 w-11",           /* 44px quadrado */
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
  ({ className, variant, size, asChild = false, isLoading = false, loadingText, children, disabled, ...props }, ref) => {
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
                cx="12" cy="12" r="10"
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

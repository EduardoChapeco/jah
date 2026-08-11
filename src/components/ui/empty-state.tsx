import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 md:p-12 min-h-[300px] border border-dashed rounded-xl bg-muted/30",
        className
      )}
      {...props}
    >
      {Icon && (
        <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Icon className="size-6 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-xl font-semibold tracking-tight text-foreground mb-1">
        {title}
      </h3>
      <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
        {description}
      </p>
      {action && (
        action.href ? (
          <Button asChild>
            <a href={action.href}>{action.label}</a>
          </Button>
        ) : (
          <Button onClick={action.onClick}>{action.label}</Button>
        )
      )}
    </div>
  );
}

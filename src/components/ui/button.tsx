import * as React from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}) {
  const base =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 cursor-pointer";

  const variants: Record<Variant, string> = {
    primary: "bg-accent-600 text-paper hover:bg-accent-700 active:bg-accent-700 shadow-sm",
    secondary: "bg-ink-900 text-paper hover:bg-ink-800",
    outline: "border border-line-strong bg-surface text-ink-900 hover:bg-ink-100",
    ghost: "text-ink-700 hover:bg-ink-100 hover:text-ink-900",
    danger: "bg-danger-600 text-paper hover:bg-danger-700",
  };

  const sizes: Record<Size, string> = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
    icon: "h-10 w-10",
  };

  return cn(base, variants[variant], sizes[size], className);
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={buttonVariants({ variant, size, className })}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

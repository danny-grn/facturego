import * as React from "react";
import { cn } from "@/lib/cn";

export const inputClasses =
  "flex h-10 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink-900 placeholder:text-ink-300 transition-colors focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100 disabled:cursor-not-allowed disabled:opacity-50";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input ref={ref} type={type} className={cn(inputClasses, className)} {...props} />
  )
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(inputClasses, "h-auto min-h-20 py-2 resize-y", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(inputClasses, "pr-8 appearance-none bg-[right_0.6rem_center] bg-no-repeat", className)} {...props}>
      {children}
    </select>
  )
);
Select.displayName = "Select";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-ink-700", className)}
      {...props}
    />
  );
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1.5 text-xs text-danger-600">{children}</p>;
}

export function FieldHint({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1.5 text-xs text-ink-500">{children}</p>;
}

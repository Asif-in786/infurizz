import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "info" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const base =
    "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium select-none";

  const variants = {
    default: "bg-zinc-100 text-zinc-800 border border-zinc-200/80",
    success: "bg-zinc-50 text-zinc-900 border border-zinc-200",
    warning: "bg-amber-50 text-amber-800 border border-amber-200",
    info: "bg-zinc-100 text-zinc-800 border border-zinc-200",
    outline: "border border-zinc-200 text-zinc-600 bg-white",
  };

  return <span className={twMerge(clsx(base, variants[variant], className))} {...props} />;
}

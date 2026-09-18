import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#e90000]/20 disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none tracking-tight";

    const variantStyles = {
      primary: "bg-[#e90000] hover:bg-[#cc0000] text-white font-medium shadow-xs active:translate-y-[1px]",
      secondary: "bg-zinc-100 hover:bg-zinc-200/80 text-zinc-900 border border-zinc-200 active:translate-y-[1px]",
      outline: "border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 active:translate-y-[1px]",
      ghost: "hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900",
    };

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 gap-1.5 font-medium",
      md: "text-xs sm:text-sm px-4 py-2 gap-2",
      lg: "text-sm px-5 py-2.5 gap-2.5 font-medium",
    };

    return (
      <button
        ref={ref}
        className={twMerge(clsx(baseStyles, variantStyles[variant], sizeStyles[size], className))}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

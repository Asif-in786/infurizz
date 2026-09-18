import React from "react";
import Image from "next/image";
import { clsx } from "clsx";

export interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  variant?: "transparent" | "badge" | "original";
}

const sizeClasses = {
  xs: "h-7 sm:h-8 w-auto max-w-full",
  sm: "h-8 sm:h-9 w-auto max-w-full",
  md: "h-12 sm:h-14 md:h-16 w-auto max-w-full",
  lg: "h-20 sm:h-24 md:h-28 lg:h-32 w-auto max-w-full",
  xl: "h-28 sm:h-36 md:h-40 w-auto max-w-full",
};

export function Logo({
  size = "md",
  className,
  imageClassName,
  priority = false,
  variant = "transparent",
}: LogoProps) {
  const src =
    variant === "badge"
      ? "/infurizz-logo-badge.png"
      : variant === "original"
      ? "/infurizz-logo.png"
      : "/infurizz-logo-cropped.png";

  const width = variant === "original" ? 1024 : 924;
  const height = variant === "original" ? 1024 : 420;

  return (
    <div
      className={clsx(
        "inline-flex items-center justify-center select-none shrink-0 overflow-visible",
        className
      )}
    >
      <Image
        src={src}
        alt="INFURIZZ - CREATE. CONNECT. GROW."
        width={width}
        height={height}
        priority={priority}
        className={clsx(
          sizeClasses[size],
          "object-contain shrink-0 transition-transform duration-150 hover:brightness-110",
          imageClassName
        )}
      />
    </div>
  );
}

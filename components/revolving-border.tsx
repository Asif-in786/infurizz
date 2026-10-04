"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

export interface RevolvingBorderProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  glowColor?: string;
  accentColor?: string;
  category?: string;
  duration?: number;
  borderWidth?: number;
  interactive?: boolean;
  tilt?: boolean;
  maxTilt?: number;
  onClick?: () => void;
}

/**
 * Category-aware dynamic color palettes
 */
export function getCategoryPalette(category?: string, customGlow?: string, customAccent?: string) {
  if (customGlow && customAccent) {
    return {
      glow: customGlow,
      accent: customAccent,
      ambient: "rgba(217, 119, 6, 0.3)",
      highlight: "rgba(251, 191, 36, 0.4)",
    };
  }

  const cat = (category || "").toLowerCase();
  if (cat.includes("tech") || cat.includes("code") || cat.includes("hardware")) {
    return {
      glow: "#1d4ed8", // Electric Cobalt
      accent: "#06b6d4", // Cyan
      ambient: "rgba(6, 182, 212, 0.35)",
      highlight: "rgba(59, 130, 246, 0.5)",
    };
  }
  if (cat.includes("food") || cat.includes("culinary") || cat.includes("coffee")) {
    return {
      glow: "#c2410c", // Burnt Paprika
      accent: "#f59e0b", // Saffron Amber
      ambient: "rgba(245, 158, 11, 0.35)",
      highlight: "rgba(251, 146, 60, 0.5)",
    };
  }
  if (cat.includes("beauty") || cat.includes("skin") || cat.includes("cosmetics")) {
    return {
      glow: "#9333ea", // Velvet Purple
      accent: "#f43f5e", // Rose Quartz
      ambient: "rgba(236, 72, 153, 0.3)",
      highlight: "rgba(244, 63, 94, 0.5)",
    };
  }
  if (cat.includes("fitness") || cat.includes("training") || cat.includes("strength")) {
    return {
      glow: "#b91c1c", // Crimson
      accent: "#ea580c", // Deep Orange
      ambient: "rgba(239, 68, 68, 0.35)",
      highlight: "rgba(251, 146, 60, 0.5)",
    };
  }
  if (cat.includes("travel") || cat.includes("outdoor") || cat.includes("alpine")) {
    return {
      glow: "#047857", // Deep Alpine Emerald
      accent: "#0284c7", // Glacial Blue
      ambient: "rgba(16, 185, 129, 0.3)",
      highlight: "rgba(56, 189, 248, 0.5)",
    };
  }
  if (cat.includes("finance") || cat.includes("investing")) {
    return {
      glow: "#1e3a8a", // Deep Navy
      accent: "#10b981", // Sage Emerald
      ambient: "rgba(16, 185, 129, 0.3)",
      highlight: "rgba(59, 130, 246, 0.4)",
    };
  }
  // Default INFURIZZ editorial luxury palette (Oxblood + Warm Amber)
  return {
    glow: "#6f2e2a",
    accent: "#d97706",
    ambient: "rgba(217, 119, 6, 0.35)",
    highlight: "rgba(245, 158, 11, 0.5)",
  };
}

/**
 * RevolvingBorder
 *
 * Highly responsive, tactile container with:
 * - Traveling perimeter beam that accelerates subtly on hover
 * - Cursor-following spotlight radial glow that tracks user interaction
 * - Subtle 3D tilt toward pointer with spring damping
 * - Category-aware luxury accent palettes
 * - Graceful fallback on touch devices and prefers-reduced-motion
 */
export function RevolvingBorder({
  children,
  className = "",
  contentClassName = "",
  glowColor,
  accentColor,
  category,
  duration = 6,
  borderWidth = 2,
  interactive = true,
  tilt = true,
  maxTilt = 3.5,
  onClick,
}: RevolvingBorderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [pointerPos, setPointerPos] = useState({ x: 0.5, y: 0.5, pxX: 0, pxY: 0 });
  const [isTouch, setIsTouch] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsTouch(window.matchMedia("(hover: none)").matches);
      setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }
  }, []);

  const palette = getCategoryPalette(category, glowColor, accentColor);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isTouch || !interactive || reducedMotion) return;
      const el = containerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const pxX = e.clientX - rect.left;
      const pxY = e.clientY - rect.top;
      const normX = Math.max(0, Math.min(1, pxX / rect.width));
      const normY = Math.max(0, Math.min(1, pxY / rect.height));

      setPointerPos({ x: normX, y: normY, pxX, pxY });
    },
    [isTouch, interactive, reducedMotion]
  );

  const handlePointerEnter = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isTouch) return;
      setIsHovered(true);
      handlePointerMove(e);
    },
    [isTouch, handlePointerMove]
  );

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false);
    setIsPressed(false);
    setPointerPos({ x: 0.5, y: 0.5, pxX: 0, pxY: 0 });
  }, []);

  // Compute 3D tilt values
  const tiltX = isHovered && tilt && !reducedMotion ? (0.5 - pointerPos.y) * maxTilt * 2 : 0;
  const tiltY = isHovered && tilt && !reducedMotion ? (pointerPos.x - 0.5) * maxTilt * 2 : 0;

  // Faster orbit duration on hover
  const activeDuration = isHovered ? Math.max(2.8, duration * 0.55) : duration;

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={() => interactive && setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      className={`group relative overflow-hidden rounded-[2px] bg-line/80 shadow-xs transition-all duration-300 ${
        isHovered ? "shadow-lg border-line" : ""
      } ${isPressed ? "scale-[0.99] transition-duration-75" : ""} ${className}`}
      style={{
        padding: `${borderWidth}px`,
        transform:
          tilt && isHovered && !reducedMotion
            ? `perspective(1000px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) translateZ(1px)`
            : "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)",
        transition: isHovered
          ? "transform 180ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 280ms ease, border-color 280ms ease"
          : "transform 420ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 320ms ease, border-color 320ms ease",
        willChange: isHovered ? "transform" : "auto",
      }}
    >
      {/* Outer ambient glow bloom */}
      <div
        className={`pointer-events-none absolute -inset-[120%] animate-revolve-spin blur-xs transition-opacity duration-500 ${
          isHovered ? "opacity-85" : "opacity-35"
        }`}
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, transparent 230deg, ${palette.ambient} 275deg, ${palette.accent} 320deg, ${palette.glow} 355deg, transparent 360deg)`,
          animationDuration: `${activeDuration}s`,
        }}
        aria-hidden="true"
      />

      {/* Primary crisp traveling perimeter conic beam */}
      <div
        className={`pointer-events-none absolute -inset-[120%] animate-revolve-spin transition-opacity duration-300 ${
          isHovered ? "opacity-100" : "opacity-85"
        }`}
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, transparent 225deg, ${palette.ambient} 260deg, ${palette.highlight} 305deg, ${palette.accent} 335deg, ${palette.glow} 358deg, transparent 360deg)`,
          animationDuration: `${activeDuration}s`,
        }}
        aria-hidden="true"
      />

      {/* Cursor-following interactive spotlight highlight (follows user pointer!) */}
      {interactive && isHovered && !reducedMotion && !isTouch && (
        <div
          className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-200"
          style={{
            background: `radial-gradient(420px circle at ${pointerPos.pxX}px ${pointerPos.pxY}px, ${palette.highlight}, transparent 65%)`,
            mixBlendMode: "screen",
            opacity: 0.65,
          }}
          aria-hidden="true"
        />
      )}

      {/* Stationary inner card surface - card content never spins */}
      <div
        className={`relative z-10 h-full w-full bg-card transition-colors duration-200 ${contentClassName}`}
      >
        {children}
      </div>
    </div>
  );
}

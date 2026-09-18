"use client";

import React, { useEffect, useState, useRef } from "react";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  divisor?: number;
  decimals?: number;
  formatCompact?: boolean;
  className?: string;
}

export function AnimatedCounter({
  value,
  duration = 1200,
  prefix = "",
  suffix = "",
  divisor = 1,
  decimals = 0,
  formatCompact = false,
  className,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    // Check prefers-reduced-motion
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayValue(value);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [hasStarted, value]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(easeOut * value));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [hasStarted, value, duration]);

  let formatted = "";
  if (divisor > 1) {
    formatted = `${prefix}${(displayValue / divisor).toFixed(decimals)}${suffix}`;
  } else if (formatCompact) {
    if (displayValue >= 1_000_000) {
      formatted = `${prefix}${(displayValue / 1_000_000).toFixed(decimals || 2)}M${suffix}`;
    } else if (displayValue >= 1_000) {
      formatted = `${prefix}${(displayValue / 1_000).toFixed(decimals || 1)}K${suffix}`;
    } else {
      formatted = `${prefix}${displayValue.toLocaleString()}${suffix}`;
    }
  } else {
    formatted = `${prefix}${displayValue.toLocaleString()}${suffix}`;
  }

  return (
    <span ref={ref} className={className}>
      {formatted}
    </span>
  );
}

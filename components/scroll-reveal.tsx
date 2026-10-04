"use client";

import React, { useEffect, useRef, useState } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  duration?: number;
  once?: boolean;
  threshold?: number;
}

/**
 * ScrollReveal
 *
 * Cinematic scroll-triggered entrance wrapper using IntersectionObserver.
 * Triggers once per element by default with customizable stagger delays.
 * Fully respects prefers-reduced-motion.
 */
export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  distance = 20,
  duration = 540,
  once = true,
  threshold = 0.12,
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Check for reduced motion preference
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsVisible(true);
      return;
    }

    const currentEl = elementRef.current;
    if (!currentEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.unobserve(currentEl);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    observer.observe(currentEl);

    return () => {
      observer.disconnect();
    };
  }, [once, threshold]);

  const getTransform = () => {
    if (isVisible) return "none";
    switch (direction) {
      case "up":
        return `translateY(${distance}px)`;
      case "down":
        return `translateY(-${distance}px)`;
      case "left":
        return `translateX(${distance}px)`;
      case "right":
        return `translateX(-${distance}px)`;
      case "none":
      default:
        return "none";
    }
  };

  return (
    <div
      ref={elementRef}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transitionProperty: "opacity, transform",
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDelay: `${delay}ms`,
        willChange: isVisible ? "auto" : "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}

/**
 * StaggerGroup
 *
 * Automatically assigns sequential stagger delays to its immediate children
 */
export function StaggerGroup({
  children,
  className = "",
  staggerInterval = 75,
  initialDelay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  staggerInterval?: number;
  initialDelay?: number;
}) {
  const childrenArray = React.Children.toArray(children);

  return (
    <div className={className}>
      {childrenArray.map((child, index) => (
        <ScrollReveal key={index} delay={initialDelay + index * staggerInterval}>
          {child}
        </ScrollReveal>
      ))}
    </div>
  );
}

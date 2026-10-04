"use client";

import React from "react";

import { LogoRailWave } from "@/components/logo-rail-wave";

/**
 * EditorialPageLoader
 *
 * Distinctive typographic brand loader with moving rail wave letters and track beam.
 * Used for initial page suspense and route transitions.
 */
export function EditorialPageLoader({ label = "Loading INFURIZZ Desk…" }: { label?: string }) {
  return (
    <div className="flex min-h-[48vh] w-full flex-col items-center justify-center p-8 text-center animate-fade-in">
      <LogoRailWave size="md" subtitle={label} />
    </div>
  );
}

/**
 * SkeletonCard
 *
 * Editorial placeholder card matching INFURIZZ dimensions and paper colors.
 */
export function SkeletonCard() {
  return (
    <div className="flex flex-col justify-between border border-line bg-card p-6">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="h-4 w-20 rounded-[1px] shimmer-warm" />
          <div className="h-4 w-14 rounded-[1px] shimmer-warm" />
        </div>

        <div className="mt-5 flex items-center gap-3">
          <div className="h-12 w-12 rounded-[1px] shimmer-warm" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-3/4 rounded-[1px] shimmer-warm" />
            <div className="h-3 w-1/2 rounded-[1px] shimmer-warm" />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="h-3 w-full rounded-[1px] shimmer-warm" />
          <div className="h-3 w-5/6 rounded-[1px] shimmer-warm" />
        </div>

        <div className="mt-4 flex gap-1.5">
          <div className="h-5 w-16 rounded-[1px] shimmer-warm" />
          <div className="h-5 w-16 rounded-[1px] shimmer-warm" />
          <div className="h-5 w-16 rounded-[1px] shimmer-warm" />
        </div>
      </div>

      <div className="mt-6 border-t border-line pt-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 rounded-[1px] shimmer-warm" />
          <div className="h-4 w-20 rounded-[1px] shimmer-warm" />
        </div>
      </div>
    </div>
  );
}

/**
 * SkeletonGrid
 *
 * Grid of skeleton cards for discover and campaign directories.
 */
export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonCard key={idx} />
      ))}
    </div>
  );
}

/**
 * SkeletonAnalytics
 *
 * Placeholder for the performance analytics suite.
 */
export function SkeletonAnalytics() {
  return (
    <div className="mt-14 border border-line bg-card p-6 sm:p-8">
      <div className="flex flex-col gap-3 border-b border-line pb-5 sm:flex-row sm:items-baseline sm:justify-between">
        <div className="space-y-2">
          <div className="h-3 w-40 rounded-[1px] shimmer-warm" />
          <div className="h-7 w-64 rounded-[1px] shimmer-warm" />
        </div>
        <div className="flex gap-1.5">
          <div className="h-7 w-20 rounded-[1px] shimmer-warm" />
          <div className="h-7 w-20 rounded-[1px] shimmer-warm" />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 border-b border-line pb-6 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="border border-line bg-paper p-4 space-y-2">
            <div className="h-3 w-20 rounded-[1px] shimmer-warm" />
            <div className="h-7 w-28 rounded-[1px] shimmer-warm" />
            <div className="h-3 w-24 rounded-[1px] shimmer-warm" />
          </div>
        ))}
      </div>

      <div className="mt-6 border border-line bg-paper p-5">
        <div className="h-48 w-full rounded-[1px] shimmer-warm" />
      </div>
    </div>
  );
}

/**
 * EditorialButton
 *
 * Accessible button with dimension lock and graceful pending states.
 */
export function EditorialButton({
  children,
  pending = false,
  pendingText = "Processing…",
  className = "",
  type = "submit",
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  pending?: boolean;
  pendingText?: string;
  className?: string;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={pending || disabled}
      className={`btn-tactile relative inline-flex min-h-11 items-center justify-center font-medium transition-all ${
        pending ? "cursor-wait opacity-80" : ""
      } ${className}`}
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
          <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse delay-75" />
          <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse delay-150" />
          <span>{pendingText}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}

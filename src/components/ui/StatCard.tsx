import * as React from "react";
import { Card } from "./Card";
import { clsx } from "clsx";

export interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ label, value, subtext, icon, trend, className }: StatCardProps) {
  return (
    <Card className={clsx("p-5 relative border border-zinc-200 bg-white rounded-xl shadow-xs", className)}>
      <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          {label}
        </span>
        {icon && <div className="text-zinc-400">{icon}</div>}
      </div>
      <div className="mt-3.5 flex items-baseline justify-between gap-2">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 font-sans">
          {value}
        </span>
        {trend && (
          <span
            className={clsx(
              "text-[11px] font-medium px-2 py-0.5 rounded-md border",
              trend.isPositive
                ? "text-zinc-800 bg-zinc-50 border-zinc-200"
                : "text-rose-700 bg-rose-50 border-rose-200"
            )}
          >
            {trend.isPositive ? "↑ " : "↓ "}
            {trend.value}
          </span>
        )}
      </div>
      {subtext && <p className="mt-2 text-xs text-zinc-500 leading-normal">{subtext}</p>}
    </Card>
  );
}

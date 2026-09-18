"use client";

import React from "react";

export interface ChartDataPoint {
  label: string;
  value: number;
}

interface AudienceGrowthChartProps {
  data: ChartDataPoint[];
  height?: number;
}

export function AudienceGrowthChart({ data, height = 220 }: AudienceGrowthChartProps) {
  if (!data || data.length < 2) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">
        Insufficient snapshot history for growth visualization.
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const paddingX = 40;
  const paddingY = 25;
  const chartWidth = 700;
  const chartHeight = height;

  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;

  const points = data.map((d, index) => {
    const x = paddingX + (index / (data.length - 1)) * innerWidth;
    const y = paddingY + innerHeight - ((d.value - minVal) / range) * innerHeight;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    // Smooth bezier curve control point
    const prev = points[i - 1];
    const cx = (prev.x + p.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;

  return (
    <div className="w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-auto overflow-visible select-none"
      >
        <defs>
          <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E90000" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#E90000" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Subtle horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = paddingY + innerHeight * (1 - ratio);
          const val = minVal + range * ratio;
          return (
            <g key={ratio}>
              <line
                x1={paddingX}
                y1={y}
                x2={chartWidth - paddingX}
                y2={y}
                stroke="#F4F4F5"
                strokeWidth="1"
              />
              <text
                x={paddingX - 8}
                y={y + 3}
                textAnchor="end"
                className="text-[10px] fill-zinc-400 font-mono tracking-tight"
              >
                {val >= 1000000 ? `${(val / 1000000).toFixed(2)}M` : `${(val / 1000).toFixed(0)}K`}
              </text>
            </g>
          );
        })}

        {/* Vertical subtle bounds */}
        <line x1={paddingX} y1={paddingY} x2={paddingX} y2={chartHeight - paddingY} stroke="#E4E4E7" strokeWidth="1" />
        <line x1={chartWidth - paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="#E4E4E7" strokeWidth="1" />

        {/* Filled Area */}
        <path d={areaD} fill="url(#growthGradient)" />

        {/* Precision Crisp Brand Red Line */}
        <path d={pathD} fill="none" stroke="#E90000" strokeWidth="2" strokeLinecap="round" />

        {/* Data points & X-axis labels */}
        {points.map((p, idx) => (
          <g key={idx} className="group cursor-pointer">
            <circle
              cx={p.x}
              cy={p.y}
              r={idx === points.length - 1 ? 4 : 2.5}
              className="fill-white stroke-[#E90000] stroke-2"
            />
            {/* Show label */}
            {(idx % 2 === 0 || idx === points.length - 1) && (
              <text
                x={p.x}
                y={chartHeight - 6}
                textAnchor="middle"
                className="text-[10px] fill-zinc-400 font-mono tracking-wider"
              >
                {p.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

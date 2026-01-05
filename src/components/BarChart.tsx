import React from "react";

interface BarChartProps {
  data: { label: string; value: number }[];
  maxBars?: number;
  height?: number;
}

// Simple SVG bar chart, mobile-optimized, no dependencies
export const BarChart: React.FC<BarChartProps> = ({
  data,
  maxBars = 8,
  height = 120,
}) => {
  const shown = data.slice(-maxBars);
  const maxValue = Math.max(...shown.map((d) => d.value), 1);
  const barWidth = 100 / shown.length;
  const topPadding = 20; // Abstand oben für Balkenspitze und Label

  return (
    <svg
      viewBox={`0 0 100 ${height}`}
      width="100%"
      height={height}
      className="block"
    >
      {shown.map((d, i) => {
        // Balkenhöhe so berechnen, dass oben immer topPadding bleibt
        const barHeight = (d.value / maxValue) * (height - topPadding - 24);
        const barY = height - barHeight - 18;
        const safeBarY = Math.max(barY, topPadding);
        return (
          <g key={d.label}>
            <rect
              x={i * barWidth + 6}
              y={safeBarY}
              width={barWidth - 8}
              height={barHeight}
              rx={2}
              fill="#f97316"
            />
            <text
              x={i * barWidth + barWidth / 2}
              y={height - 4}
              textAnchor="middle"
              fontSize="10"
              fill="#888"
            >
              {/* Monat/Jahr anzeigen, z.B. 01/24 */}
              {d.label}
            </text>
            <text
              x={i * barWidth + barWidth / 2}
              y={safeBarY - 6}
              textAnchor="middle"
              fontSize="10"
              fill="#fff"
            >
              {d.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

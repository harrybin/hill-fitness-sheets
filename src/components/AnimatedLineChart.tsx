import React, { useEffect, useRef } from "react";

interface AnimatedLineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

// Animated SVG line chart, mobile-optimized, no dependencies
export const AnimatedLineChart: React.FC<AnimatedLineChartProps> = ({
  data,
  height = 120,
  color = "#f97316",
}) => {
  const pathRef = useRef<SVGPathElement>(null);
  const shown = data.slice(-10);
  const maxValue = Math.max(...shown.map((d) => d.value), 1);
  const width = 100;
  const step = width / (shown.length - 1 || 1);

  // Build path string
  const points = shown.map((d, i) => {
    const x = i * step;
    const y = height - 24 - (d.value / maxValue) * (height - 32);
    return [x, y];
  });
  const path = points
    .map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`))
    .join(" ");

  // Animate path drawing
  useEffect(() => {
    const el = pathRef.current;
    if (el) {
      const len = el.getTotalLength();
      el.style.strokeDasharray = String(len);
      el.style.strokeDashoffset = String(len);
      setTimeout(() => {
        el.style.transition =
          "stroke-dashoffset 1.2s cubic-bezier(.4,1.6,.4,1)";
        el.style.strokeDashoffset = "0";
      }, 100);
    }
  }, [path]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      className="block"
    >
      {/* Area fill */}
      <polygon
        points={
          points.map(([x, y]) => `${x},${y}`).join(" ") +
          ` ${width},${height - 24} 0,${height - 24}`
        }
        fill={color + "22"}
      />
      {/* Animated line */}
      <path
        ref={pathRef}
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        style={{ strokeDasharray: 0, strokeDashoffset: 0 }}
      />
      {/* Dots */}
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.8} fill={color} />
      ))}
      {/* Labels */}
      {shown.map((d, i) => (
        <text
          key={d.label}
          x={i * step}
          y={height - 6}
          textAnchor="middle"
          fontSize="10"
          fill="#888"
        >
          {d.label}
        </text>
      ))}
    </svg>
  );
};

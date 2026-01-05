import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnimatedLineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

export const AnimatedLineChart: React.FC<AnimatedLineChartProps> = ({
  data,
  height = 120,
  color = "#f97316",
}) => {
  const shown = data.slice(-10);
  const chartData = {
    labels: shown.map((d) => d.label),
    datasets: [
      {
        label: "Verlauf",
        data: shown.map((d) => d.value),
        borderColor: color,
        backgroundColor: color + "22",
        fill: true,
        tension: 0.4,
        pointRadius: 2,
      },
    ],
  };
  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: { enabled: true },
      datalabels: { display: false },
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { display: false }, beginAtZero: true },
    },
  };
  return <Line data={chartData} options={options} height={height} />;
};

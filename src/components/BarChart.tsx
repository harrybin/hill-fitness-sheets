import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

interface BarChartProps {
  data: { label: string; value: number }[];
  maxBars?: number;
  height?: number;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  maxBars = 8,
  height = 120,
}) => {
  const shown = data.slice(-maxBars);
  const chartData = {
    labels: shown.map((d) => d.label),
    datasets: [
      {
        label: "Trainingshäufigkeit",
        data: shown.map((d) => d.value),
        backgroundColor: "#f97316",
      },
    ],
  };
  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
      datalabels: {
        anchor: "end",
        align: "start",
        color: "#fff",
        font: { weight: "bold", size: 12 },
        formatter: (value) => value,
        offset: -4,
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: { display: false },
    },
  };
  return (
    <Bar
      data={chartData}
      options={options}
      plugins={[ChartDataLabels]}
      height={height}
    />
  );
};

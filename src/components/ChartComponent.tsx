import React, { useEffect, useRef } from "react";
import { createChart, IChartApi } from "lightweight-charts";
import { data } from "../constants/data";
import { useTheme } from "../contexts/ThemeContext";

const ChartComponent: React.FC = () => {
  const { theme } = useTheme();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (chartContainerRef.current) {
      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
        layout: {
          background: { color: theme === "dark" ? "#28282B" : "#FFFFFF" },
          textColor: theme === "dark" ? "#f8f9fa" : "#343a40",
        },
        timeScale: {
          borderColor: theme === "dark" ? "#495057" : "#dee2e6",
        },
        grid: {
          vertLines: { color: theme === "dark" ? "#343434" : "#e9e9ea" },
          horzLines: { color: theme === "dark" ? "#343434" : "#e9e9ea" },
        },
      });
      const barSeries = chart.addCandlestickSeries();
      barSeries.setData(data);

      chartRef.current = chart;

      return () => {
        chart.remove();
        chartRef.current = null;
      };
    }
  }, [theme]);

  useEffect(() => {
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <div ref={chartContainerRef} className="w-full h-full" />;
};

export default ChartComponent;

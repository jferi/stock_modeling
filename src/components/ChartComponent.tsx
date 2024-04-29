import React, { useContext, useEffect, useRef } from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  ChartOptions,
  TimeScaleOptions,
  DeepPartial
} from "lightweight-charts";
import { useTheme } from "../contexts/ThemeContext";
import ChartDataContext from "../contexts/ChartDataContext";

interface ChartComponentProps {
  data: any[];
}

const ChartComponent: React.FC<ChartComponentProps> = ({ data }) => {
  const { theme } = useTheme();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const { chartData } = useContext(ChartDataContext) || {};

  useEffect(() => {
    if (chartContainerRef.current && !chartRef.current) {
      const chartOptions: DeepPartial<ChartOptions> & {
        timeScale: DeepPartial<TimeScaleOptions>;
      } = {
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
        layout: {
          background: { color: theme === "dark" ? "#28282B" : "#FFFFFF" },
          textColor: theme === "dark" ? "#f8f9fa" : "#343a40"
        },
        timeScale: {
          borderColor: theme === "dark" ? "#495057" : "#dee2e6"
        },
        grid: {
          vertLines: { color: theme === "dark" ? "#343434" : "#e9e9ea" },
          horzLines: { color: theme === "dark" ? "#343434" : "#e9e9ea" }
        }
      };
      const chart = createChart(chartContainerRef.current, chartOptions);
      const series = chart.addCandlestickSeries();
      if (chartData) {
        const convertedData = chartData.map((data) => ({
          time: data.time, // Convert the time to a UTCTimestamp
          open: data.open,
          high: data.high,
          low: data.low,
          close: data.close
        }));
        series.setData(convertedData);
      }
      chartRef.current = chart;
      seriesRef.current = series;
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.applyOptions({
        layout: {
          background: { color: theme === "dark" ? "#28282B" : "#FFFFFF" },
          textColor: theme === "dark" ? "#f8f9fa" : "#343a40"
        },
        timeScale: {
          borderColor: theme === "dark" ? "#495057" : "#dee2e6"
        },
        grid: {
          vertLines: { color: theme === "dark" ? "#343434" : "#e9e9ea" },
          horzLines: { color: theme === "dark" ? "#343434" : "#e9e9ea" }
        }
      });
    }
  }, [theme]);

  useEffect(() => {
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight
        });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (seriesRef.current) {
      seriesRef.current.setData(data);
    }
  }, [data]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
};

export default ChartComponent;

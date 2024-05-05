import {
  ChartOptions,
  DeepPartial,
  IChartApi,
  ISeriesApi,
  TimeScaleOptions,
  createChart
} from "lightweight-charts";
import React, { useEffect, useRef } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useChartData } from "../store/chartdata";
import { useTimeStamp } from "../store/timestamp";

interface ChartComponentProps {
  data: any[];
}

const ChartComponent: React.FC<ChartComponentProps> = ({ data }) => {
  const { theme } = useTheme();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const chartData = useChartData((state) => state.data);
  const timeframe = useTimeStamp((state) => state.timestamp);

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
        if (timeframe == "1D") {
          const convertedData = chartData.map((data) => ({
            time: data.Day.time,
            open: data.Day.open,
            high: data.Day.high,
            low: data.Day.low,
            close: data.Day.close
          }));
          series.setData(convertedData);
          console.log(convertedData);
        } else {
          const convertedData = chartData.map((data) => ({
            time: data.Intraday.time,
            open: data.Intraday.open,
            high: data.Intraday.high,
            low: data.Intraday.low,
            close: data.Intraday.close
          }));
          series.setData(convertedData);
          console.log(convertedData);
        }
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
    console.log(timeframe);
    if (seriesRef.current) {
      if (timeframe == "1D") {
        const convertedData = data.map((data) => ({
          time: data.Day.time,
          open: data.Day.open,
          high: data.Day.high,
          low: data.Day.low,
          close: data.Day.close
        }));
        seriesRef.current.setData(convertedData);
      } else {
        const convertedData = data.map((data) => ({
          time: data.IntraDay.time,
          open: data.IntraDay.open,
          high: data.IntraDay.high,
          low: data.IntraDay.low,
          close: data.IntraDay.close
        }));
        seriesRef.current.setData(convertedData);
      }
    }
  }, [data]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
};

export default ChartComponent;

import { invoke } from "@tauri-apps/api/tauri";
import { useAtomValue } from "jotai/react";
import {
  ChartOptions,
  DeepPartial,
  IChartApi,
  ISeriesApi,
  Range,
  Time,
  TimeScaleOptions,
  UTCTimestamp,
  createChart
} from "lightweight-charts";
import { FC, useEffect, useRef } from "react";
import { themeAtom } from "../store/atoms";
import { useChartData } from "../store/chartdata";
import { useSidebarLabels } from "../store/sidebar";
import { useTimeStamp } from "../store/timestamp";
import { StockChartData } from "../types";
type BackendData = {
  from: string;
  to: string;
};

async function getBackendData(
  symbol: string,
  timeframe: string
): Promise<BackendData> {
  return await invoke("get_range", { symbol, timeframe });
}

function isBefore2000(date: number): boolean {
  const year2000 = new Date("2000-02-01").getTime();
  return date < year2000;
}

function isTimeRangeExceeding(
  fromVisible: number,
  fromBackend: number,
  timeframe: string
): boolean {
  const timeframeMultipliers: { [key: string]: number } = {
    "1M": 1,
    "1H": 60,
    "1D": 1440,
    "1WK": 10080
  };

  const timeframeMultiplier = timeframeMultipliers[timeframe] || 1;
  const timeframeMillis = 30 * timeframeMultiplier * 1000 * 30;
  return fromVisible - fromBackend <= timeframeMillis;
}

const ChartComponent: FC<{ data: any[] }> = ({ data }) => {
  const theme = useAtomValue(themeAtom);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const chartData = useChartData((state) => state.data);
  const label = useSidebarLabels((state) => state.label);
  const timeframe = useTimeStamp((state) => state.timestamp);
  const timeRangeChangeHandlerRef = useRef<
    ((range: Range<Time> | null) => Promise<void>) | null
  >(null);
  const setData = useChartData((state) => state.setData);

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
          borderColor: theme === "dark" ? "#495057" : "#dee2e6",
          rightOffset: 12,
          barSpacing: 15,
          fixLeftEdge: true,
          lockVisibleTimeRangeOnResize: true,
          borderVisible: false,
          visible: true,
          timeVisible: true
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
          time: new Date(data.time).getTime() as UTCTimestamp,
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
          borderColor: theme === "dark" ? "#495057" : "#dee2e6",
          rightOffset: 12,
          barSpacing: 15,
          timeVisible: true
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
      const convertedData = data.map((data) => ({
        time: (new Date(data.time).getTime() / 1000) as UTCTimestamp,
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close
      }));
      seriesRef.current.setData(convertedData);
    }
    if (chartRef.current) {
      if (timeRangeChangeHandlerRef.current) {
        chartRef.current
          .timeScale()
          .unsubscribeVisibleTimeRangeChange(timeRangeChangeHandlerRef.current);
      }

      const timeRangeChangeHandler = async (range: Range<Time> | null) => {
        if (range) {
          const fromVisible = (range.from as UTCTimestamp) * 1000;

          const backendData = await getBackendData(label, timeframe);
          const backendDate = new Date(backendData.to);
          if (isBefore2000(backendDate.getTime())) {
            return;
          }
          const fromBackend = backendDate.getTime();

          const isExceeding = isTimeRangeExceeding(
            fromVisible,
            fromBackend,
            timeframe
          );

          if (isExceeding) {
            const data = await invoke("fetch_stock_chart", {
              symbol: label,
              timeframe
            });
            setData(data as StockChartData[]);
          }
        }
      };

      timeRangeChangeHandlerRef.current = timeRangeChangeHandler;
      chartRef.current
        .timeScale()
        .subscribeVisibleTimeRangeChange(timeRangeChangeHandlerRef.current);
    }
  }, [data, label, timeframe]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
};

export default ChartComponent;

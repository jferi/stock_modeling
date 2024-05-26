import { invoke } from "@tauri-apps/api/tauri";
import { useAtomValue } from "jotai";
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
import { IndicatorData, useIndicatorStore } from "../store/indicators";
import { useSidebarLabels } from "../store/sidebar";
import { useTimeStamp } from "../store/timestamp";
import { StockChartData } from "../types";
import {
  getBackendData,
  handleIndicatorChange,
  indicatorColors,
  isBefore2000,
  isTimeRangeExceeding,
  show_charts
} from "./utils/ChartUtil";

const Chart: FC<{ data: any[] }> = ({ data }) => {
  const theme = useAtomValue(themeAtom);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const chartData = useChartData((state) => state.data);
  const label = useSidebarLabels((state) => state.label);
  const timeframe = useTimeStamp((state) => state.timestamp);
  const setData = useChartData((state) => state.setData);
  const timeRangeChangeHandlerRef = useRef<
    ((range: Range<Time> | null) => Promise<void>) | null
  >(null);
  const activeIndicators = useIndicatorStore((state) => state.activeIndicators);
  const seriesReferences = useIndicatorStore((state) => state.seriesReferences);
  const removeIndicator = useIndicatorStore((state) => state.removeIndicator);
  const addIndicator = useIndicatorStore((state) => state.addIndicator);
  const indicatorsToDelete = useIndicatorStore(
    (state) => state.indicatorsToDelete
  );

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
      const series = chart.addCandlestickSeries({
        priceScaleId: "price"
      });
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
    if (chartRef.current) {
      const visibleRange = chartRef.current.timeScale().getVisibleRange();
      chartRef.current.applyOptions({
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
      });
      if (visibleRange) {
        chartRef.current.timeScale().setVisibleRange(visibleRange);
      }
    }
  }, [theme]);

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
          const fromVisible = range.from as UTCTimestamp;

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

    const activeIndicatorsArray = Array.from(activeIndicators.keys());
    activeIndicatorsArray.forEach((type) => {
      removeIndicator(type);
    });
    activeIndicatorsArray.forEach((type) => {
      addIndicator(label, timeframe, type);
    });
    handleIndicatorChange(chartRef.current!, activeIndicators, chartRef);
  }, [data, label, timeframe]);

  useEffect(() => {
    const activeIndicatorsArray = Array.from(activeIndicators.keys());
    activeIndicatorsArray.forEach((type) => {
      if (!seriesReferences.has(type)) {
        const data = activeIndicators.get(type);
        const key = type.split(" ")[0];
        if ((key === "SMA" && data) || (key === "EMA" && data)) {
          const lineSeries = chartRef.current!.addLineSeries({
            color: indicatorColors[key],
            lineWidth: 1,
            priceLineVisible: false,
            priceScaleId: "ma"
          });
          const convertedData = data[0]!.map((item) => ({
            time: (new Date(item.time).getTime() / 1000) as UTCTimestamp,
            value: item.value
          }));
          lineSeries.setData(convertedData as any);
          seriesReferences.set(type, [lineSeries]);
        } else if (key === "MACD" && data) {
          const convertedDatas: IndicatorData[][] = [];
          for (let i = 0; i < data.length; i++) {
            const convertedData = data[i]!.map((item) => ({
              time: (new Date(item.time).getTime() / 1000) as UTCTimestamp,
              value: item.value
            }));
            convertedDatas.push(convertedData);
          }
          let mapMacd = show_charts(
            chartRef.current!,
            convertedDatas as IndicatorData[][]
          );
          seriesReferences.set(type, Array.from(mapMacd.values()));
        } else if (key === "RSI" && data) {
          const rsiSeries = chartRef.current!.addLineSeries({
            color: indicatorColors["RSI"],
            lineWidth: 1,
            priceLineVisible: false,
            priceScaleId: "rsi"
          });

          const convertedData = data[0]!.map((item) => ({
            time: (new Date(item.time).getTime() / 1000) as UTCTimestamp,
            value: item.value
          }));

          rsiSeries.setData(convertedData as any);
          seriesReferences.set(type, [rsiSeries]);
        } else if (key === "VOLUME" && data) {
          const volumeSeries = chartRef.current!.addHistogramSeries({
            color: indicatorColors["VOLUME"],
            priceFormat: {
              type: "volume"
            },
            priceScaleId: "volume"
          });
          const convertedData = data[0]!.map((item) => ({
            time: (new Date(item.time).getTime() / 1000) as UTCTimestamp,
            value: item.value
          }));
          volumeSeries.setData(convertedData as any);
          seriesReferences.set(type, [volumeSeries]);
        }
      }
    });
    handleIndicatorChange(chartRef.current!, activeIndicators, chartRef);
  }, [activeIndicators, seriesReferences]);

  useEffect(() => {
    if (chartRef.current) {
      indicatorsToDelete.forEach((type) => {
        chartRef.current!.removeSeries(type);
      });
      const activeIndicatorsArray = Array.from(activeIndicators.keys());
      let hasRsi = false;
      let hasMacd = false;
      let hasMa = false;
      activeIndicatorsArray.forEach((type) => {
        const key = type.split(" ")[0];
        if (key === "RSI") {
          hasRsi = true;
        } else if (key === "MACD") {
          hasMacd = true;
        } else if (key === "SMA" || key === "EMA") {
          hasMa = true;
        }
      });
      if (!hasRsi && !hasMacd) {
        chartRef.current!.priceScale("price").applyOptions({
          scaleMargins: {
            top: 0,
            bottom: 0.05
          }
        });
        if (hasMa) {
          chartRef.current!.priceScale("ma").applyOptions({
            scaleMargins: {
              top: 0,
              bottom: 0.05
            }
          });
        }
      }
    }

    indicatorsToDelete.length = 0;
  }, [indicatorsToDelete, seriesReferences]);

  return (
    <div className="flex flex-col h-full w-full">
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
};

export default Chart;

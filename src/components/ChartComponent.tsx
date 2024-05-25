import { invoke } from "@tauri-apps/api/tauri";
import { useAtomValue } from "jotai";
import {
  ChartOptions,
  DeepPartial,
  IChartApi,
  ISeriesApi,
  Range,
  SeriesOptionsMap,
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

const indicatorColors: { [key: string]: string } = {
  SMA: "#ff6464", // Soft Red
  EMA: "#6464ff", // Soft Blue
  RSI: "#64ff64", // Soft Green
  MACD: "#855085", // Soft Purple
  signalLine: "#b9b964", // Soft Yellow
  macdHistogram: "#64ffff" // Soft Cyan
};

const show_charts = (chart: IChartApi, datas: IndicatorData[][]) => {
  let histMap = show_histogram(chart, datas[2], "macdHistogram");
  let macd = datas[0];
  let signal = datas[1];
  let maMap = show_mas(
    chart,
    [macd, signal],
    ["#ffffff", "#ff0000"],
    ["macdLine", "signalLine"]
  );

  let merged: Map<String, ISeriesApi<keyof SeriesOptionsMap>> = new Map([
    ...histMap,
    ...maMap
  ]);
  return merged;
};

const show_mas = (
  chart: IChartApi,
  datasma: any[],
  colors: string[],
  priceScaleIds: string[]
) => {
  let lineSeries;
  let returnMap = new Map<String, ISeriesApi<keyof SeriesOptionsMap>>();
  for (let i = 0; i < datasma.length; i++) {
    lineSeries = chart.addLineSeries({
      priceScaleId: priceScaleIds[i],
      color: colors[i],
      lineWidth: 1,
      priceLineVisible: false,
      priceFormat: {
        type: "price",
        precision: 6
      }
    });
    lineSeries.setData(datasma[i]);
    returnMap.set(priceScaleIds[i], lineSeries);
  }
  return returnMap;
};

const show_histogram = (
  chart: IChartApi,
  histogram: any[],
  priceScaleId: string
) => {
  let histogramMap = new Map<String, ISeriesApi<keyof SeriesOptionsMap>>();
  let histogramSeries = chart.addHistogramSeries({
    priceScaleId: priceScaleId,
    color: indicatorColors[priceScaleId],
    priceLineVisible: false,
    priceFormat: {
      type: "volume",
      precision: 6
    }
  });

  histogramSeries.setData(histogram);
  histogramMap.set(priceScaleId, histogramSeries);
  return histogramMap;
};

const ChartComponent: FC<{ data: any[] }> = ({ data }) => {
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

  function handleIndicatorChange() {
    const rsiScaleMargins = {
      top: 0.7,
      bottom: 0.05
    };
    const macdScaleMargins = {
      top: 0.7,
      bottom: 0.05
    };
    const rsiScaleMarginsWithMacd = {
      top: 0.7,
      bottom: 0.15
    };
    const macdScaleMarginsWithRsi = {
      top: 0.85,
      bottom: 0
    };
    const maScaleMarginsNothing = {
      top: 0.05,
      bottom: 0.05
    };
    const maScaleMarginsHist = {
      top: 0.05,
      bottom: 0.3
    };
    const volumeMarginsNothing = {
      top: 0.7,
      bottom: 0
    };
    const volumeMarginsHist = {
      top: 0.6,
      bottom: 0.3
    };
    if (chartRef.current) {
      const activeIndicatorsArray = Array.from(activeIndicators.keys());
      let hasRsi = false;
      let hasMacd = false;
      let hasMa = false;
      let hasVolume = false;
      activeIndicatorsArray.forEach((type) => {
        const key = type.split(" ")[0];
        if (key === "RSI") {
          hasRsi = true;
        } else if (key === "MACD") {
          hasMacd = true;
        } else if (key === "SMA" || key === "EMA") {
          hasMa = true;
        } else if (key === "VOLUME") {
          hasVolume = true;
        }
      });

      if (hasRsi || hasMacd) {
        chartRef.current
          .priceScale("price")
          .applyOptions({ scaleMargins: maScaleMarginsHist });
      } else {
        chartRef.current
          .priceScale("price")
          .applyOptions({ scaleMargins: maScaleMarginsNothing });
      }
      if (hasMa) {
        if (hasRsi || hasMacd) {
          chartRef.current
            .priceScale("ma")
            .applyOptions({ scaleMargins: maScaleMarginsHist });
        } else if (!hasRsi && !hasMacd) {
          chartRef.current
            .priceScale("ma")
            .applyOptions({ scaleMargins: maScaleMarginsNothing });
        }
      }
      if (hasVolume) {
        if (hasRsi || hasMacd) {
          chartRef.current.priceScale("volume").applyOptions({
            scaleMargins: volumeMarginsHist
          });
        }
        if (!hasRsi && !hasMacd) {
          chartRef.current.priceScale("volume").applyOptions({
            scaleMargins: volumeMarginsNothing
          });
        }
      }
      if (hasRsi) {
        if (hasMacd) {
          chartRef.current.priceScale("rsi").applyOptions({
            scaleMargins: rsiScaleMarginsWithMacd
          });
        } else {
          chartRef.current.priceScale("rsi").applyOptions({
            scaleMargins: rsiScaleMargins
          });
        }
      }
      if (hasMacd) {
        if (hasRsi) {
          chartRef.current.priceScale("macdLine").applyOptions({
            scaleMargins: macdScaleMarginsWithRsi
          });
          chartRef.current.priceScale("macdHistogram").applyOptions({
            scaleMargins: macdScaleMarginsWithRsi
          });
          chartRef.current.priceScale("signalLine").applyOptions({
            scaleMargins: macdScaleMarginsWithRsi
          });
        } else {
          chartRef.current.priceScale("macdLine").applyOptions({
            scaleMargins: macdScaleMargins
          });
          chartRef.current.priceScale("macdHistogram").applyOptions({
            scaleMargins: macdScaleMargins
          });
          chartRef.current.priceScale("signalLine").applyOptions({
            scaleMargins: macdScaleMargins
          });
        }
      }
    }
  }

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
    handleIndicatorChange();
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
    handleIndicatorChange();
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

export default ChartComponent;

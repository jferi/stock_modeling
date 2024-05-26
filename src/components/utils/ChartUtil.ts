import { invoke } from "@tauri-apps/api/tauri";
import { IChartApi, ISeriesApi, SeriesOptionsMap } from "lightweight-charts";
import { IndicatorData } from "../../store/indicators";

export const indicatorColors: { [key: string]: string } = {
  SMA: "#ff6464",
  EMA: "#6464ff",
  RSI: "#64ff64",
  MACD: "#855085",
  signalLine: "#b9b964",
  macdHistogram: "#64ffff"
};

export type BackendData = {
  from: string;
  to: string;
};

export async function getBackendData(
  symbol: string,
  timeframe: string
): Promise<BackendData> {
  return await invoke("get_range", { symbol, timeframe });
}

export function isBefore2000(date: number): boolean {
  const year2000 = new Date("2000-02-01").getTime();
  return date < year2000;
}

export function isTimeRangeExceeding(
  fromVisible: number,
  fromBackend: number
): boolean {
  const timeframeMillis = 24 * 60 * 60 * 1000;
  return fromVisible - fromBackend <= timeframeMillis;
}

export function handleIndicatorChange(
  _chart: IChartApi,
  activeIndicators: Map<string, IndicatorData[][]>,
  chartRef: React.RefObject<IChartApi>
) {
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

export const show_charts = (chart: IChartApi, datas: IndicatorData[][]) => {
  let histMap = show_histogram(chart, datas[2], "macdHistogram");
  let macd = datas[0];
  let signal = datas[1];
  let maMap = show_mas(
    chart,
    [macd, signal],
    [indicatorColors["MACD"], indicatorColors["signalLine"]],
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

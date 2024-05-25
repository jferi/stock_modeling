import { UTCTimestamp } from "lightweight-charts";
import { IndicatorData, IndicatorState } from "../store/indicators";

interface IndicatorResult {
  sma?: IndicatorData[];
  ema?: IndicatorData[];
  rsi?: IndicatorData[];
  macd_line?: IndicatorData[];
  signal_line?: IndicatorData[];
  macd_histogram?: IndicatorData[];
}

function convertToUTCTimestamp(
  indicators: IndicatorResult
): Partial<IndicatorState> {
  const convert = (data: IndicatorData[] | undefined) => {
    return (
      data?.map(({ time, value }) => {
        const date = new Date(time);
        if (isNaN(date.getTime())) {
          console.error(
            `Invalid date string=${time}, expected format=yyyy-mm-dd`
          );
          return {
            time: 0 as UTCTimestamp,
            value
          };
        }
        return {
          time: (date.getTime() / 1000) as UTCTimestamp,
          value
        };
      }) || []
    );
  };

  return {
    sma: convert(indicators.sma),
    ema: convert(indicators.ema),
    rsi: convert(indicators.rsi),
    macdLine: convert(indicators.macd_line),
    signalLine: convert(indicators.signal_line),
    macdHistogram: convert(indicators.macd_histogram)
  };
}

export default convertToUTCTimestamp;

import { invoke } from "@tauri-apps/api/tauri";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { StockChartData, StockChartDataArray } from "../types";
import { useTimeStamp } from "./timestamp";

type TState = {
  data: StockChartData[];
  setData(data: StockChartDataArray): void;
  getData(label: string): Promise<StockChartData[]>;
};

const useChartData = create<TState>()(
  immer((set, _get) => ({
    data: [],
    setData: (data) => {
      set((state) => {
        state.data = data;
      });
    },
    getData: async (label: string) => {
      const timeframe = useTimeStamp((state) => state.timestamp);
      const period1 = useTimeStamp((state) => state.period1);
      const period2 = useTimeStamp((state) => state.period2);
      const data = await invoke<StockChartData[]>("fetch_stock_chart", {
        symbol: label,
        timeframe: timeframe,
        period1: period1,
        period2: period2
      });

      return data;
    }
  }))
);

export { useChartData };
